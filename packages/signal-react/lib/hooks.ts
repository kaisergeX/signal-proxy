/* eslint-disable react-hooks/refs */
import {
  createEffect,
  createComputed,
  type Signal,
  type SignalEffect,
  type ComputedOptions,
} from '@kaiverse/signal';
import {useCallback, useEffect, useReducer, useRef, useSyncExternalStore} from 'react';

/**
 * Signal effect inside React component.
 * ___
 * @param effect Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 */
// ⚠️ [Experimental] Implementation of React adapter. Known issues:
// 1. [Potentially fixed via restore effectTrackingCache, unverified since can't reproduce the issue].
//    Some env has this issue: When there're `N` (N>1) `useSignalEffect` in 1 component, each tracking a diff Signal, and only 1 Signal changes, those effects sometime trigger `N` times.
//    No idea. The issue might be occurring because of multiple empty deps useEffect.
//    Reproduce?: Playground page - Hit the "`Local multiplier 4x`" button multiple times
export const useSignalEffect = (effect: SignalEffect): void => {
  const effectRef = useRef(effect);
  effectRef.current = effect;
  useEffect(() => createEffect(() => effectRef.current()), []);
};

/**
 * Derived/computed Signal inside a React component.
 * `useSyncComputed` is integrated with `useSyncExternalStore` (`uSES`) which is a recommended way to use "external stores" in React.
 * ___
 * The value returned is always the stable Signal getter.
 * Shares `useSyncSignal`'s concurrent rendering caveats, since both are `uSES`-backed.
 * ___
 * If `factory` just reads a single existing Signal without deriving anything new (e.g. `useSyncComputed(() => globalCount())`),
 * prefer `{@link useSyncSignalValue}` instead — no extra `createComputed` hop, no owned resource to tear down.
 *
 * @param factory computes the derived value from other Signals. Re-evaluated whenever a Signal it reads changes.
 *   Always sees the latest closure — safe to reference props/state from the current render.
 * @param options `equals` to customize change comparison, same as `createSignal`.
 */
// Created once on first render and torn down on unmount (deferred + cancellable, see `subscribe`).
// ⚠️ StrictMode dev: the double render pass creates a throwaway computed that is never cleaned up
// (its hook state is discarded with no cleanup opportunity), so it stays subscribed to its deps.
// Harmless but real: every Signal it depends on recomputes for it on each change.
// Uses `uSES` internally purely as the re-render trigger.
export function useSyncComputed<T>(
  factory: () => T,
  options?: Pick<ComputedOptions<T>, 'equals'>,
): Signal<T> {
  const factoryRef = useRef(factory);
  factoryRef.current = factory; // always call into the latest render's closure

  const computedRef = useRef<ReturnType<typeof createComputed<T>>>();
  const onStoreChangeRef = useRef<() => void>();
  const isFirstRunRef = useRef(true);

  if (computedRef.current === undefined) {
    computedRef.current = createComputed(() => factoryRef.current(), factoryRef.current(), {
      ...options,
      onChange: () => {
        // `createComputed`'s internal effect runs once immediately on creation (how dependency tracking works)
        // — that first onChange fires with nothing having actually changed for the consumer; skip it so uSES doesn't force a re-render right after mount.
        if (isFirstRunRef.current) {
          isFirstRunRef.current = false;
          return;
        }
        onStoreChangeRef.current?.();
      },
    });
  }

  const teardownTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const subscribe = useCallback((onStoreChange: () => void) => {
    onStoreChangeRef.current = onStoreChange;
    // A re-subscribe means the previous unsubscribe was React's effect teardown→re-setup cycle
    // (StrictMode double-invoked effects, Suspense hide/show) — cancel the deferred teardown so the computed stays alive and subscribed.
    clearTimeout(teardownTimerRef.current);
    return () => {
      onStoreChangeRef.current = undefined;
      // Defer the teardown of the underlying computed to a macrotask: React can unsubscribe + resubscribe without re-rendering (so no new computed is created),
      // and killing it eagerly leaves the component holding a dead, unsubscribed computed.
      teardownTimerRef.current = setTimeout(() => {
        computedRef.current?.cleanup(); // tear down the underlying computed itself on unmount
      });
    };
  }, []);

  useSyncExternalStore(subscribe, computedRef.current); // side effect only - return value intentionally discarded
  return computedRef.current;
}

/**
 * Derived/computed Signal inside a React component.
 * ___
 * `useComputed` uses `useReducer` and returns a snapshot of Signal.
 * It works better with concurrent rendering but has the same temporary tearing issue as `useSignal`.
 *
 * Consider using {@link useSyncComputed}, which uses `useSyncExternalStore` and solves tearing,
 * but doesn't work well with concurrent rendering. It's a trade-off - choose wisely.
 * ___
 * If `factory` just reads a single existing Signal without deriving anything new (e.g. `useComputed(() => globalCount())`),
 * prefer `{@link useSignalValue}` instead — no extra `createComputed` hop, no owned resource to tear down.
 *
 * @param factory Computes the derived value.
 * Only reacts to Signals read inside it — plain React state/props are invisible to it. Reading them is fine, but changes won't trigger a recompute;
 * the old value sticks around until some Signal change causes a recompute, which then picks up whatever they currently are.
 * To make a computed react to a React value, mirror it into a Signal first (e.g. `useEffect(() => setSomeSignal(value), [value])`). But why?
 * @param options `equals` to customize change comparison, same as `createSignal`.
 */
// Created once on first render and torn down on unmount (deferred + cancellable, see the effect below).
// ⚠️ StrictMode dev: the double render pass creates a throwaway computed that is never cleaned up
// (its hook state is discarded with no cleanup opportunity), so it stays subscribed to its deps.
// Harmless but real: every Signal it depends on recomputes for it on each change.
export function useComputed<T>(
  factory: () => T,
  options?: Pick<ComputedOptions<T>, 'equals'>,
): Signal<T> {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  const isFirstRunRef = useRef(true);

  const computedRef = useRef<ReturnType<typeof createComputed<T>>>();
  if (computedRef.current === undefined) {
    computedRef.current = createComputed(() => factoryRef.current(), factoryRef.current(), {
      ...options,
      onChange: () => {
        if (isFirstRunRef.current) {
          isFirstRunRef.current = false;
          return;
        }
        forceUpdate();
      },
    });
  }

  const teardownTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    // A re-setup means the previous cleanup was React's effect teardown→re-setup cycle
    // (StrictMode double-invoked effects, Suspense hide/show) — cancel the deferred teardown so the computed stays alive and subscribed.
    clearTimeout(teardownTimerRef.current);
    const computed = computedRef.current;
    return () => {
      // Defer the teardown to a macrotask: React can run cleanup + re-run this effect without re-rendering
      // (so no new computed is created in between), and killing the computed eagerly there leaves the component holding a dead, unsubscribed computed.
      teardownTimerRef.current = setTimeout(() => computed?.cleanup());
    };
  }, []);
  return computedRef.current;
}
