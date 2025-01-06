import {createEffect, createComputed, type Signal, type SignalEffect} from '@kaiverse/signal';
import {useEffect, useReducer, useRef} from 'react';

/**
 * Signal effect inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter. Known issues:
 * - Some env has this issue: When there're `N` (N>1) `useSignalEffect` in 1 component, each tracking a diff Signal, and only 1 Signal changes, those effects sometime trigger `N` times.
 * No idea. The issue might be occurring because of multiple empty deps useEffect.
 * Reproduce?: Playground page - Hit the "`Local multiplier 4x`" button multiple times
 *
 * @param effect Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself.
 */
export const useSignalEffect = (effect: SignalEffect): void => {
  // const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const cleanupEffect = createEffect(effect);
    // forceUpdate();
    return cleanupEffect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * Use `createComputed` - derived signals inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter.
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
