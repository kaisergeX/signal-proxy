/* eslint-disable react-hooks/refs */
import {useCallback, useReducer, useRef, useSyncExternalStore} from 'react';
import {
  createEffect,
  createSignal,
  type SignalFactoryReturnType,
  type SignalOptions,
} from '@kaiverse/signal';

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
  options: SignalOptions<T | undefined> = {},
): SignalFactoryReturnType<T | undefined> {
  const signalRef = useRef<SignalFactoryReturnType<T | undefined>>();
  if (signalRef.current === undefined) {
    signalRef.current = createSignal<T | undefined>(value, options);
  }

  const externalSubscribe = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => {
      // createEffect's body runs immediately and synchronously on creation
      // so skip onStoreChange since nothing has changed yet
      let isFirstRun = true;
      return createEffect(() => {
        signalRef.current?.[0]();
        if (isFirstRun) {
          isFirstRun = false;
          return;
        }
        onStoreChange();
      });
    },
    [],
  );

  useSyncExternalStore(externalSubscribe, signalRef.current[0]);

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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange; // always the latest closure

  if (signalRef.current === undefined) {
    signalRef.current = createSignal<T | undefined>(value, {
      equals,
      onChange: (v) => {
        onChangeRef.current?.(v);
        forceUpdate();
      },
    });
  }

  return signalRef.current;
}
