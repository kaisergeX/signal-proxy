import {
  createComputed,
  createEffect,
  createSignal,
  type Signal,
  type SignalEffect,
  type SignalFactoryReturnType,
  type SignalOptions,
} from '@kaiverse/signal';
import {useCallback, useEffect, useReducer, useRef, useSyncExternalStore} from 'react';

/**
 * Use `Signal` inside React component.
 * ___
 * ⚠️ [Experimental] Lack of testing. **DO NOT** use in production.
 * - `useSignal`'s setter causes component to re-render twice on strict mode.
 */
export function useSignal<T>(): SignalFactoryReturnType<T | undefined>;
export function useSignal<T>(value: T, options?: SignalOptions<T>): SignalFactoryReturnType<T>;
export function useSignal<T>(
  value?: T,
  {equals, onChange}: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const signalRef = useRef<SignalFactoryReturnType<T | undefined>>();
  if (!signalRef.current) {
    signalRef.current = createSignal<T | undefined>(value, {equals, onChange});
  }

  useSyncExternalStore(
    useCallback((onStoreChange) => {
      const cleanupEffect = createEffect(() => {
        signalRef.current?.[0]();
        onStoreChange();
      });
      return cleanupEffect;
    }, []),
    signalRef.current[0],
  );

  return signalRef.current;
}

/**
 * Signal effect inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter. **DO NOT** use in production. Known issues:
 * - Some devices has this issue: When there're `N` (N>1) `useSignalEffect` in 1 component, each tracking a diff Signal, and only 1 Signal changes, those effects sometime trigger `N` times.
 * No idea. The issue might be occurring because of multiple empty deps useEffect.
 * Reproduce?: Playground page - Hit the "`Local multiplier 4x`" button multiple times
 *
 * @param effect Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 */
export const useSignalEffect = (effect: SignalEffect) => {
  // const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const cleanupEffect = createEffect(effect);
    // forceUpdate();
    return () => cleanupEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * Use `createComputed` - derived signals inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter. **DO NOT** use in production.
 */
export const useComputed = <T>(factory: () => T): Signal<T> => {
  const [_, rerender] = useReducer((x) => x + 1, 0);
  const computedSignalRef = useRef<Signal<T>>();
  if (!computedSignalRef.current) {
    computedSignalRef.current = createComputed<T>(() => {
      rerender();
      return factory();
    });
  }

  return computedSignalRef.current;
};
