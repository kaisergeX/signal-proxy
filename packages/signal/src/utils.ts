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

const effectTrackingCache: EffectTracking[] = [];
function getCurrentEffectTracking(): EffectTracking | undefined {
  return effectTrackingCache[effectTrackingCache.length - 1];
}

/**
 * Ignores tracking any of the dependencies inside the `untrackFn` scope.
 *
 * @param untrackFn the executing code block.
 * @returns the return value of `untrackFn`.
 */
export function unTrack<T>(untrackFn: SignalUntrackFn<T>): T {
  const currEffectTracking = getCurrentEffectTracking();
  if (!currEffectTracking) {
    return untrackFn();
  }

  effectTrackingCache.pop();
  try {
    return untrackFn();
  } finally {
    effectTrackingCache.push(currEffectTracking);
  }
}

let batchingLevel = 0; // Tracks nesting `batch` depth, use count instead of boolean to support nested `batch`
const pendingEffects = new Set<EffectTracking>();

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
      for (const effect of [...pendingEffects]) {
        effect.execute();
      }
      pendingEffects.clear();
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
          pendingEffects.add(effectDetail);
        } else {
          effectDetail.execute();
        }
      }
    },
    equals === undefined
      ? undefined
      : (currentValue, newValue) =>
          typeof equals === 'boolean' ? equals : equals(currentValue.value, newValue.value),
  );
  const getSignalValue: Signal<T | undefined> = () => {
    const currEffectTracking = getCurrentEffectTracking();
    if (currEffectTracking) {
      subscribes.add(currEffectTracking);
      currEffectTracking.deps.add(subscribes);
    }

    return signal.value;
  };

  const updateSignal: SignalSetter<T | undefined> = (valueSetter?: unknown) => {
    const newValue = typeof valueSetter !== 'function' ? valueSetter : valueSetter(signal.value);
    signal.value = newValue;
    return newValue;
  };

  return [getSignalValue, updateSignal];
}

/**
 * @param effect Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 * @returns a cleanup function. It will stop related Effect.
 */
export function createEffect(effect: SignalEffect): CleanupEffectFn {
  const effectDetail: EffectTracking = {
    execute: () => {
      cleanupEffect(effectDetail);
      effectTrackingCache.push(effectDetail);
      try {
        effect();
      } finally {
        effectTrackingCache.pop();
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
 *
 * Dependencies are all Signals that are used inside the Computed function.
 *
 * @returns Computed Signal - a derived value in many reactive computations via Signal(s)
 */
export function createComputed<T>(computedCb: () => T): Signal<T> {
  const [computedSignal, setComputedSignal] = createSignal(computedCb());
  createEffect(() => setComputedSignal(computedCb()));
  return computedSignal;
}
