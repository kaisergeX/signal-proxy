// Inspired by [KnockoutJS](https://github.com/knockout/knockout) and [SolidJS](https://github.com/solidjs)'s Signal implementation

import {signalProxy} from './core';
import type {
  SignalEffect,
  EffectTracking,
  Signal,
  SignalFactoryReturnType,
  SignalOptions,
  SignalSetter,
  CleanupEffectFn,
} from './types';

let effectTracking: EffectTracking | null = null;

/**
 * Ignores tracking any of the dependencies in the `untrackEffectCb` and returns its value
 *
 * @param untrackEffectCb
 */
export function unTrack(untrackEffectCb: SignalEffect): void {
  const prevEffectTracking = effectTracking;
  effectTracking = null;
  const untrackEffectExecute = untrackEffectCb();
  effectTracking = prevEffectTracking;
  return untrackEffectExecute;
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
      [...subscribes].forEach(({execute}) => execute());
    },
    equals === undefined
      ? undefined
      : (currentValue, newValue) =>
          typeof equals === 'boolean' ? equals : equals(currentValue.value, newValue.value),
  );
  const getSignalValue: Signal<T | undefined> = () => {
    if (effectTracking) {
      subscribes.add(effectTracking);
      effectTracking.deps.add(subscribes);
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
 * @param effectCb Imperative function that will run whenever dependencies change. Dependencies are Signals that are used inside the Effect itself
 * @returns a cleanup function. It will stop related Effect.
 */
export function createEffect(effect: SignalEffect): CleanupEffectFn {
  const effectDetail: EffectTracking = {
    execute: () => {
      cleanupEffect(effectDetail);
      effectTracking = effectDetail;
      effect();
      effectTracking = null;
    },
    deps: new Set(),
  };

  effectDetail.execute();

  // if (import.meta.hot) {
  //   import.meta.hot.dispose((_) => {
  //     cleanupEffect(effectDetail);
  //   });
  // }

  return () => cleanupEffect(effectDetail);
}

/**
 * `createComputed` creates a readonly reactive value equal to the return value of the given function and this function only gets executed when its dependencies change.
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
