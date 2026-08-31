// Inspired by [KnockoutJS](https://github.com/knockout/knockout) and [SolidJS](https://github.com/solidjs/solid)'s Signal implementation

import {signalProxy} from './core';
import type {
  BatchUpdateFn,
  CleanupFn,
  ComputedOptions,
  ComputedSignal,
  EffectOptions,
  EffectTracking,
  HmrContext,
  Signal,
  SignalEffect,
  SignalFactoryReturnType,
  SignalOptions,
  SignalSetter,
  SignalUntrackFn,
} from './types';

export const IS_DEV = (() => {
  try {
    // `process.env.{MODE|DEV}` will be replaced to `import.meta.env.{DEV|MODE}` in build time
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.MODE === 'development' ||
      !!process.env.DEV ||
      import.meta.env.DEV // always `false` in build time, only used for this lib playground in dev mode.
    );
  } catch {
    return false;
  }
})();

function isHmrContext(value: unknown): value is HmrContext {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return 'dispose' in value && typeof value.dispose === 'function';
}

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

  let caughtError: unknown;
  let result!: T;
  try {
    result = batchFn();
  } finally {
    batchingLevel--;

    if (batchingLevel === 0) {
      // Process all effects including those added during execution (cascading effects).
      // We clone the set and clear it before processing so that any new effects added during execution
      // (e.g., effect A updates signal -> triggers effect B) are caught in the next while iteration instead of being deferred to the next batch cycle.
      while (batchedComputations.size > 0) {
        const effects = [...batchedComputations];
        batchedComputations.clear();
        for (const effect of effects) {
          try {
            effect.execute();
          } catch (e) {
            console.error('[signal] Error executing batched effect:', e);
            caughtError ??= e; // keep the FIRST error if multiple effects throw
          }
        }
      }
    }
  }

  if (IS_DEV && caughtError) throw caughtError;
  return result;
}

/**
 * Stop Effect from tracking its dependencies
 *
 * @param effectTracking a Effect that will be cleanup
 */
function cleanupEffect(effectTracking: EffectTracking) {
  let caughtError: unknown;
  try {
    effectTracking.userCleanup?.();
  } catch (e) {
    console.error('[signal] Cleanup error:', e);
    caughtError = e;
  } finally {
    effectTracking.userCleanup = undefined;
  }

  batchedComputations.delete(effectTracking);

  for (const dep of effectTracking.deps) {
    dep.delete(effectTracking);
  }

  effectTracking.deps.clear();

  if (IS_DEV && caughtError) throw caughtError;
}

/**
 * Create a Signal. It track a `value` that changes over time.
 * ___
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
    equals === undefined || equals === true
      ? undefined
      : (currentValue, newValue) => (equals === false ? false : equals(currentValue.value, newValue.value)),
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
export function createEffect(effectFn: SignalEffect, options?: EffectOptions): CleanupFn {
  if (effectTrackingCache) {
    if (IS_DEV) {
      console.warn(
        '[signal] Nested computation/effect call ignored.',
        'This warning is only shown in development mode.',
      );
    }

    return () => undefined;
  }

  const effectDetail: EffectTracking = {
    execute: () => {
      cleanupEffect(effectDetail);

      // Save/restore instead of hard-reset to `null`.
      // If this effect's body triggers another signal update that synchronously re-runs a DIFFERENT effect (nested/re-entrant execute()),
      // that inner run's own `finally` must hand tracking back to US, not wipe it to `null` —
      // otherwise any signal reads in our body AFTER that nested trigger point go untracked and silently stop re-running this effect.
      // Same save/restore pattern as `unTrack`.
      const prevTracking = effectTrackingCache;
      effectTrackingCache = effectDetail;
      let caughtError: unknown;
      try {
        effectDetail.userCleanup = effectFn() ?? undefined;
      } catch (e) {
        console.error('[signal] Effect error:', e);
        caughtError = e;
      } finally {
        effectTrackingCache = prevTracking;
      }

      if (IS_DEV && caughtError) throw caughtError; // dev: fail loud so sth throw inside effectFn aren't silently swallowed
    },
    deps: new Set(),
  };

  effectDetail.execute();

  const cleanup = () => cleanupEffect(effectDetail);
  if (IS_DEV && options?.hot) {
    options.hot.dispose(cleanup); // cleanupEffect is idempotent — safe alongside manual dispose too
  }

  return cleanup;
}

/**
 * Creates a readonly reactive value equal to the return value of the given function and this function only gets executed when its dependencies change.
 * ___
 * Dependencies are all Signals that are used inside the Computed function.
 *
 * @param computedFn receives its previous value or `initValue`, if set, and returns a new value.
 *  `computedFn` should only read Signals.
 *  Reading anything else (React state, a plain variable) works but isn't tracked —
 *  it's picked up lazily on the next Signal-driven run, not when it itself changes.
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
export function createComputed<R, Prev extends R = R>(
  computedFn: (prev: undefined | NoInfer<Prev>) => R,
): ComputedSignal<R>;
export function createComputed<R extends Prev, Init = R, Prev = R>(
  computedFn: (prev: Prev | Init) => R,
  initValue: Init,
  options?: ComputedOptions<R>,
): ComputedSignal<R>;
export function createComputed<R extends Prev, Init, Prev = R>(
  computedFn: (prev: Prev | Init) => R,
  initValue?: Init,
  options?: ComputedOptions<R>,
): ComputedSignal<R> {
  const {hot, ...signalOptions} = options || {};
  const [computedSignal, setComputedSignal] = createSignal<R>(initValue as R, signalOptions);
  const cleanup = createEffect(() => {
    setComputedSignal(computedFn(unTrack(computedSignal)));
  }, hot && {hot});
  return Object.assign(computedSignal, {cleanup});
}

/**
 * Wraps `createEffect` and `createComputed` so that any Effect/Computed they create is automatically disposed right before the calling module is hot-reloaded —
 * preventing stale closures from staying subscribed to signals after an edit.
 * ___
 * Call this once per module, at module scope, passing `import.meta.hot` (Vite) or `module.hot` (webpack/Rspack).
 * In production these are `undefined`, so `withHMR` becomes a zero-cost passthrough — safe to leave in shipped code.
 * ⚠️ Planned removal: `withHMR` and the `hot` option will be superseded by the bundler-plugin HMR feature.
 *
 * @param hot the module's HMR context, or `undefined` outside dev/HMR-enabled builds.
 * @returns `createEffect`/`createComputed` with identical signatures to the originals, scoped to this module's HMR lifecycle.
 */
export function withHMR(hot: HmrContext | undefined) {
  if (!isHmrContext(hot)) {
    if (IS_DEV) {
      console.warn(
        '[withHMR] Incorrect HMRContext, dispose function is required. Computation/Effect might not cleanup properly on hot reloaded module.',
        'This warning is only shown in development mode.',
      );
    }

    return Object.freeze({createEffect, createComputed});
  }

  const cleanups = new Set<CleanupFn>();

  hot.dispose(() => {
    const fns = [...cleanups];
    cleanups.clear();
    for (const fn of fns) {
      try {
        fn();
      } catch (e) {
        console.error('[signal] Error during HMR cleanup:', e);
      }
    }
  });

  const wrappedCreateEffect: typeof createEffect = (effectFn) => {
    const cleanup = createEffect(effectFn);
    cleanups.add(cleanup);
    return cleanup;
  };

  const wrappedCreateComputed: typeof createComputed = <R extends Prev, Init, Prev = R>(
    computedFn: (prev: Prev | Init) => R,
    initValue?: Init,
    options?: ComputedOptions<R>,
  ) => {
    const computed = createComputed(computedFn, initValue as Init, options);
    cleanups.add(computed.cleanup);
    return computed;
  };

  return Object.freeze({createEffect: wrappedCreateEffect, createComputed: wrappedCreateComputed});
}
