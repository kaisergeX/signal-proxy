/* eslint-disable react-hooks/refs */
import {
  createEffect,
  createSignal,
  type Signal,
  type SignalFactoryReturnType,
  type SignalOptions,
} from '@kaiverse/signal';
import {useCallback, useEffect, useReducer, useRef, useSyncExternalStore} from 'react';

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

/**
 * Reads the current value of an already-existing Signal inside a React component.
 * 
 * Returns a plain reactive value, that acts like React state, not a Signal — it's no longer trackable by `useSignalEffect`/`useSyncComputed`.
 * If you need tracking elsewhere (e.g. inside `useSignalEffect`), use the original Signal directly or `useSyncComputed` instead — don't pass this hook's return value into it.
 * ___
 * Use this to consume a Signal created *outside* the component (a module-level store, or one  returned by another hook) — as opposed to `useSignal`/`useSyncSignal`,
 * which both *create and own* a Signal local to the component.
 *
 * Lighter than `useSyncComputed(signal)` for this case: no wrapping `createComputed`, so no extra recompute hop and no owned resource to tear down on unmount — just a direct subscription.
 * ___
 * Uses `useSyncExternalStore`, same trade-offs as {@link useSyncSignal} (solves tearing, but doesn't work well with concurrent rendering).
 * See {@link useSignalValue} for the `useReducer`-backed twin.
 *
 * @param signal a Signal, expected to be a **stable reference** across renders (e.g. a module-level export).
 *  Passing a fresh Signal created inline every render works but resubscribes on every render for no benefit — hoist it out instead.
 */
export function useSyncSignalValue<T>(signal: Signal<T>): ReturnType<Signal<T>> {
  const signalRef = useRef(signal);
  signalRef.current = signal;

  const externalSubscribe = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => {
      let isFirstRun = true;
      return createEffect(() => {
        signalRef.current();
        if (isFirstRun) {
          isFirstRun = false;
          return;
        }
        onStoreChange();
      });
    },
    [],
  );

  return useSyncExternalStore(externalSubscribe, signalRef.current);
}

/**
 * Reads the current value of an already-existing Signal inside a React component.
 *
 * Returns a plain reactive value, that acts like React state, not a Signal — it's no longer trackable by `useSignalEffect`/`useComputed`.
 * If you need tracking elsewhere (e.g. inside `useSignalEffect`), use the original Signal directly or `useComputed` instead — don't pass this hook's return value into it.
 * ___
 * `useSignalValue` uses `useReducer` to trigger a re-render on change. It works better with concurrent rendering but has the temporary tearing issue.
 *
 * Consider using {@link useSyncSignalValue}, which uses `useSyncExternalStore` and solves tearing,
 * but doesn't work well with concurrent rendering. It's a trade-off — choose wisely.
 * ___
 * @param signal a Signal, expected to be a **stable reference** across renders. (e.g. a module-level export).
 *  Passing a fresh Signal created inline every render works but resubscribes on every render for no benefit — hoist it out instead.
 */
export function useSignalValue<T>(signal: Signal<T>): ReturnType<Signal<T>> {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const signalRef = useRef(signal);
  signalRef.current = signal;

  useEffect(() => {
    let isFirstRun = true;
    return createEffect(() => {
      signalRef.current();
      if (isFirstRun) {
        isFirstRun = false;
        return;
      }
      forceUpdate();
    });
  }, []);

  return signal();
}
