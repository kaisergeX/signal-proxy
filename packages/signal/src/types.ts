export type ObjectAny = Record<PropertyKey, unknown>;
export type SignalUpdateCallback<T extends ObjectAny> = (
  property: keyof T,
  value: T[keyof T],
) => void;

/**
 * Customize Signal comparison
 *
 * @default Object.is
 */
export type SignalCompareEqual<in T> = (currentValue: T, newValue: T) => boolean;
export type SignalSetterCb<in out T> = (prevValue: T) => T;
// export type SignalSetter<in out T> = (value: T | SignalSetterCb<T>) => T;
export type SignalSetter<in out T> = {
  <U extends T>(
    ...args: undefined extends T ? [] : [value: (prevValue: T) => U]
  ): undefined extends T ? undefined : U;
  (value: T | SignalSetterCb<T>): T;
};

/** Signals value getter. */
export type Signal<T> = () => T;
/** Signal options */
export type SignalOptions<T> = {
  /**
   * Customize Signal comparison
   * ___
   * If `false`, always rerun related dependents (Effects, Computed Signals) after the setter is called even if the new value is equal to the current value.
   *
   * @default Object.is
   */
  equals?: boolean | SignalCompareEqual<T>;
  /** Runs whenever Signal value changes */
  onChange?: (newValue: T) => void;
};
/** Return type of a Signal */
export type SignalFactoryReturnType<T> = Readonly<[get: Signal<T>, set: SignalSetter<T>]>;
/** An Effect that runs whenever its dependencies change. */
export type SignalEffect = () => void;
export type EffectTracking = {execute: SignalEffect; deps: Set<Set<EffectTracking>>};
export type CleanupEffectFn = () => void;
