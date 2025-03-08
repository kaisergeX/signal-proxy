// Inspired by [KnockoutJS](https://github.com/knockout/knockout) and [SolidJS](https://github.com/solidjs/solid)'s Signal implementation

import {signalProxy} from './core';
import type {
  SignalEffect,
  EffectTracking,
  Signal,
  SignalFactoryReturnType,
  SignalOptions,
  SignalSetter,
  CleanupEffectFn,
  SignalUntrackFn,
  BatchUpdateFn,
} from './types';

export const IS_DEV = (() => {
  try {
    // `process.env.{MODE|DEV}` will be replaced to `import.meta.env.{DEV|MODE}` in build time
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.MODE === 'development' ||
      process.env.DEV ||
      import.meta.env.DEV // always `false` in build time, used for this lib playground in dev mode.
    );
  } catch {
    return false;
  }
})();

let effectTrackingCache: EffectTracking | null = null;

/**
 * Ignores tracking any of the dependencies inside the `untrackFn` scope.
 *
 * @param untrackFn the executing code block.
 * @returns the return value of `untrackFn`.
 */
export function unTrack<T>(untrackFn: SignalUntrackFn<T>): T {
  const currEffectTracking = effectTrackingCache;
  effectTrackingCache = null;

  try {
    return untrackFn();
  } finally {
    effectTrackingCache = currEffectTracking;
  }
}

let batchingLevel = 0; // Tracks nesting `batch` depth, use count instead of boolean to support nested `batch`
const batchedComputations = new Set<EffectTracking>();

/**
 * Batches multiple updates together.
 * ___
 * More precisely, during the `batchFn` block, it holds executing related computations until the end to prevent unnecessary recalculation.
 *
 * @param batchFn a function that contains multiple Signal updates.
 * @returns the return value of `batchFn`.
 */
export function batch<T>(batchFn: BatchUpdateFn<T>): T {
  batchingLevel++;

  try {
    return batchFn();
  } finally {
    batchingLevel--;

    if (batchingLevel === 0) {
      // only execute pending effects when the outermost batch completes.
      for (const effect of [...batchedComputations]) {
        effect.execute();
      }
      batchedComputations.clear();
    }
  }
}

/**
 * Stop Effect from tracking its dependencies
 *
 * @param effectTracking a Effect that will be cleanup
 */
function cleanupEffect(effectTracking: EffectTracking) {
  for (const dep of effectTracking.deps) {
    dep.delete(effectTracking);
  }

  effectTracking.deps.clear();
}

/**
 * Create a Signal. It track a `value` that changes over time.
 * ___
 * ⚠️ In DEV environment with HMR enabled, dependents aren't cleanup and still tracking related Signals. Need to find a way to cleanup between reloads.
 *
 * @param value initial value
 * @returns a pair of readonly reactive `value` and its setter
 * @description [Docs](https://kaisergex.github.io/kaiverse/utils/signal/#createsignal) | [JSR Docs](https://jsr.io/@kaiverse/signal/doc/~/createSignal)
 */
export function createSignal<T>(): SignalFactoryReturnType<T | undefined>;
export function createSignal<T>(value: T, options?: SignalOptions<T>): SignalFactoryReturnType<T>;
export function createSignal<T>(
  value?: T,
  {equals, onChange}: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const subscribes = new Set<EffectTracking>();
  const signal = signalProxy(
    {value},
    (_, newValue) => {
      onChange?.(newValue);
      for (const effectDetail of [...subscribes]) {
        if (batchingLevel > 0) {
          batchedComputations.add(effectDetail);
        } else {
          effectDetail.execute();
        }
      }
    },
    equals === undefined
      ? undefined
      : (currentValue, newValue) => (typeof equals === 'boolean' ? equals : equals(currentValue.value, newValue.value)),
  );
  const getSignalValue: Signal<T | undefined> = () => {
    if (effectTrackingCache) {
      subscribes.add(effectTrackingCache);
      effectTrackingCache.deps.add(subscribes);
    }

    // Deeply immutable structure still in proposal stage, stick with shallow freeze for now.
    // https://github.com/tc39/proposal-record-tuple
    return Object.freeze(signal.value);
  };

  const updateSignal: SignalSetter<T | undefined> = (valueSetter?: unknown) => {
    const newValue = typeof valueSetter !== 'function' ? valueSetter : valueSetter(signal.value);
    signal.value = newValue;
    return newValue;
  };

  return [getSignalValue, updateSignal];
}

/**
 * @param effectFn Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 * @returns a cleanup function. It will stop related Effect.
 * @description [Docs](https://kaisergex.github.io/kaiverse/utils/signal/#createeffect) | [JSR Docs](https://jsr.io/@kaiverse/signal/doc/~/createEffect)
 */
export function createEffect(effectFn: SignalEffect): CleanupEffectFn {
  if (effectTrackingCache) {
    if (IS_DEV) {
      console.warn(
        'Warning: Nested computation/effect calls are not allowed and no additional effect will happen.',
        'This warning is only shown in development mode.',
      );
    }

    return () => undefined;
  }

  const effectDetail: EffectTracking = {
    execute: () => {
      cleanupEffect(effectDetail);
      effectTrackingCache = effectDetail;
      try {
        effectFn();
      } finally {
        effectTrackingCache = null;
      }
    },
    deps: new Set(),
  };

  // const weakEffectDetailRef = new WeakRef(effectDetail);
  effectDetail.execute();

  // if (import.meta.hot) {
  //   import.meta.hot.dispose((_) => {
  //     cleanupEffect(effectDetail);
  //   });
  // }

  return () => cleanupEffect(effectDetail);
}

/**
 * Creates a readonly reactive value equal to the return value of the given function and this function only gets executed when its dependencies change.
 * ___
 * Dependencies are all Signals that are used inside the Computed function.
 *
 * @param computedFn a function that receives its previous value or `initValue`, if set, and returns a new value used for
 * @param initValue an optional initial value for the computation; if set, `computedFn` will never receive undefined as first computation result.
 * @param options custom comparison or listen on computation result changes.
 * @returns Computed Signal - result from expensive calculations/computations usually based on other Signals.
 * @description [Docs](https://kaisergex.github.io/kaiverse/utils/signal/#createcomputed) | [JSR Docs](https://jsr.io/@kaiverse/signal/doc/~/createComputed)
 * `initValue` is only used for the first `computedFn`'s `prev` argument value and first computation comparison (`options.equals`).
 * Unless your first calculation or comparison depends on `prev`, no need to set `initValue`.
 * The returned Signal's first value will be the computed result by `computedFn` instead of `initValue`.
 */
// With `createComputed(() => 123, 0)`, the type will be infer correctly (`computedFn: (prev: number) => number`).
// If specify type for `prev` like this `createComputed((prev: string) => 123, 'string')`, type guard is working, a type error will be shown correctly since `prev` should be `string | number`.
// But when computedFn defined like this `createComputed((prev) => 123, 0)`, `prev` type is `unknown`, still not found a proper way to infer it correctly.
// For now, `prev` type should be explicitly defined to get type hint (`createComputed((prev: string | number) => 123, 'string')`).
export function createComputed<R, Prev extends R = R>(computedFn: (prev: undefined | NoInfer<Prev>) => R): Signal<R>;
export function createComputed<R extends Prev, Init = R, Prev = R>(
  computedFn: (prev: Prev | Init) => R,
  initValue: Init,
  options?: SignalOptions<R>,
): Signal<R>;
export function createComputed<R extends Prev, Init, Prev = R>(
  computedFn: (prev: Prev | Init) => R,
  initValue?: Init,
  options?: SignalOptions<R>,
): Signal<R> {
  const [computedSignal, setComputedSignal] = createSignal<R>(undefined as R, options);
  createEffect(() => setComputedSignal(computedFn(unTrack(computedSignal)) ?? (initValue as R)));
  return computedSignal;
}
