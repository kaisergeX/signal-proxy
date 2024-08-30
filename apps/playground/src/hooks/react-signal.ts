import {
  createComputed,
  createEffect,
  createSignal,
  type Signal,
  type SignalEffect,
  type SignalFactoryReturnType,
  type SignalOptions,
} from '@kaiverse/signal';
import {useEffect, useMemo, useReducer} from 'react';

/**
 * Use `Signal` inside React component.
 * ___
 * ⚠️ [Experimental] Lack of testing. **DO NOT** use in production.
 * - `useSignal`'s setter causes component to re-render twice on strict mode.
 *
 * **Diagnosis of Heap-memory required!!!** Check if `signal` from `useSignal()` is garbage collected after the component is unmounted
 */
export function useSignal<T>(): SignalFactoryReturnType<T | undefined>;
export function useSignal<T>(value: T, options?: SignalOptions<T>): SignalFactoryReturnType<T>;
export function useSignal<T>(
  value?: T,
  {equals, onChange}: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  /**
   * Need check, find a way to createSignal only once on React strict mode (useMemo here runs twice)
   */
  return useMemo(
    () =>
      createSignal<T | undefined>(value, {
        equals,
        onChange: (v) => {
          onChange?.(v);
          forceUpdate();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

/**
 * Signal effect inside a React component.
 * @param effect Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 */
export const useSignalEffect = (effect: SignalEffect) => {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const cleanupEffect = createEffect(effect);
    forceUpdate();
    return () => cleanupEffect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * Use `createComputed` - derived signals inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter. **DO NOT** use in production.
 *
 * **Diagnosis of Heap-memory required!!!** Check if `signal` returned from `useComputed()` is garbage collected after the component is unmounted
 */
export const useComputed = <T>(factory: () => T): Signal<T> => {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  return useMemo(
    () =>
      createComputed<T>(() => {
        forceUpdate();
        return factory();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
};
