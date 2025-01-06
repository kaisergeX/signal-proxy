import {
  createComputed,
  createEffect,
  createSignal,
  type Signal,
  type SignalEffect,
  type SignalFactoryReturnType,
  type SignalOptions,
} from '@kaiverse/signal';
import {
  useCallback,
  useDebugValue,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
} from 'react';

/**
 * Use `Signal` inside React component. `useSyncSignal` is integrated with `useSyncExternalStore` (`uSES`) which is a recommended way to use "external stores" in React.
 * ___
 * `useSyncSignal` works well in most cases. However, `uSES` doesn't work with concurrent rendering. `useSyncSignal`'s setter wrapped with `startTransition` won't behave as expected.
 * Suspend a render based on a store value returned by `uSES` will trigger the nearest `Suspense` fallback instead of showing the old UI.
 * [Read more: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore#:~:text=It%E2%80%99s%20not%20recommended%20to%20suspend%20a%20render%20based%20on%20a%20store%20value%20returned%20by%20useSyncExternalStore)
 * ___
 * {@link useSignal}, on the other hand, doesn't use `uSES`. It returns a snapshot of Signal and uses `useReducer` to perform a re-render on Signal changes.
 * As a result, It works better with concurrent rendering but suffers from temporary tearing issue.
 *
 * It's a trade-off after all. Choose the one that fits your use case.
 */
export function useSyncSignal<T>(): SignalFactoryReturnType<T | undefined>;
export function useSyncSignal<T>(value: T, options?: SignalOptions<T>): SignalFactoryReturnType<T>;
export function useSyncSignal<T>(
  value?: T,
  {equals, onChange}: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const signalRef = useRef<SignalFactoryReturnType<T | undefined>>();
  if (!signalRef.current) {
    signalRef.current = createSignal<T | undefined>(value, {equals, onChange});
  }

  const externalSubscribe = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) =>
      createEffect(() => {
        signalRef.current?.[0]();
        onStoreChange();
      }),
    [],
  );

  useSyncExternalStore(externalSubscribe, signalRef.current[0]);

  useDebugValue(signalRef.current[0]());
  return signalRef.current;
}

/**
 * Use `Signal` inside React component.
 * ___
 * `useSignal` uses `useReducer` and returns a snapshot of Signal. It works better with concurrent rendering but has temporary tearing issue.
 *
 * Consider using {@link useSyncSignal} which uses `useSyncExternalStore` that solves tearing issues, but doesn't work well with concurrent rendering.
 * It's a trade-off, choose wisely.
 * ___
 * Read more about [the tearing issue](https://github.com/reactwg/react-18/discussions/69).
 */
export function useSignal<T>(): SignalFactoryReturnType<T | undefined>;
export function useSignal<T>(value: T, options?: SignalOptions<T>): SignalFactoryReturnType<T>;
export function useSignal<T>(
  value?: T,
  {equals, onChange}: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const signalRef = useRef<SignalFactoryReturnType<T | undefined>>();
  if (!signalRef.current) {
    // https://react.dev/reference/react/useRef#avoiding-recreating-the-ref-contents
    signalRef.current = createSignal<T | undefined>(value, {
      equals,
      onChange: (v) => {
        onChange?.(v);
        forceUpdate();
      },
    });
  }
  useDebugValue(signalRef.current[0]());
  return signalRef.current;
}

/**
 * Signal effect inside React component.
 * ___
 * ⚠️ [Experimental] Implementation of React adapter. **DO NOT** use in production. Known issues:
 * - Some env has this issue: When there're `N` (N>1) `useSignalEffect` in 1 component, each tracking a diff Signal, and only 1 Signal changes, those effects sometime trigger `N` times.
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
    return cleanupEffect;
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
