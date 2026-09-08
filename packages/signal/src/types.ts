/** Any plain object */
export type ObjectAny = Record<PropertyKey, unknown>;
/** The HMR context a bundler exposes per-module: `import.meta.hot` (Vite) or `module.hot` (webpack/Rspack). */
export type HmrContext = {
  dispose(cb: () => void): void;
};

/** Signal Proxy on update callback */
export type SignalUpdateCallback<T extends ObjectAny> = (property: keyof T, value: T[keyof T]) => void;

/** Signal Proxy's options */
export type SignalProxyOptions<in T extends ObjectAny> = {
  /**
   * Whether the Signal value mutation is allowed to update the property value or not.
   *
   * - `true` to allow the update.
   * - `false` to skip the update.
   * - Same with the custom function if provided.
   *
   * @param property the property key that changed
   * @param currentValue the current value of the property
   * @param newValue the new value being set
   */
  shouldUpdate?: boolean | (<K extends keyof T>(property: K, currentValue: T[K], newValue: T[K]) => boolean);
};

/**
 * Customize Signal comparison
 *
 * @default Object.is
 */
type SignalComparison<in T> = (currentValue: T, newValue: T) => boolean;
export type SignalSetterCb<in out T> = (prevValue: T) => T;
// export type SignalSetter<in out T> = (value: T | SignalSetterCb<T>) => T;
export type SignalSetter<in out T> = {
  <U extends T>(...args: undefined extends T ? [] : [value: (prevValue: T) => U]): undefined extends T ? undefined : U;
  (value: T | SignalSetterCb<T>): T;
};

/** Signals value getter. */
export type Signal<T> = () => Readonly<T>;
/** Signal options */
export type SignalOptions<T> = {
  /**
   * Customize Signal comparison. Whether the Signal should update or not.
   * ___
   * - If `false`, the signal will always update, and rerun related dependents (Effects, Computed Signals) after the setter is called regardless of value equality.
   * - If providing a custom function, it should be pure and returns `false` to trigger update, otherwise `true`.
   *
   * @default Object.is
   */
  equals?: false | SignalComparison<T>;
  /** Runs whenever Signal value changes */
  onChange?: (newValue: T) => void;
};
/** Return type of a Signal */
export type SignalFactoryReturnType<T> = Readonly<[get: Signal<T>, set: SignalSetter<T>]>;
/** Signals value getter. */
export type ComputedSignal<T> = Signal<T> & {cleanup: CleanupFn};
/** HMR options */
type HmrOptions = {
  /**
   * Pass `import.meta.hot` (Vite) or `module.hot` (webpack/Rspack) in DEV to auto-dispose this Effect
   * when the calling module hot-reloads, preventing a stale copy from staying subscribed alongside the new one.
   * ___
   * For a module that creates more than one Effect/Computed, prefer `withHMR(hot)` instead — it wires this up once for the whole module rather than per call.
   * Don't pass `hot` here *and* use `withHMR` for the same Effect; that registers cleanup twice for no benefit.
   * ⚠️ Planned removal: `hot` and `withHMR` will be superseded by the bundler-plugin HMR feature.
   */
  hot?: HmrContext;
};
/** Computed options */
export type ComputedOptions<T> = SignalOptions<T> & HmrOptions;
/**
 * An Effect that runs whenever its dependencies change.
 * ___
 * May optionally return a `CleanupFn`, which runs right before the next re-run and on final teardown —
 * use it to undo imperative side effects (listeners, timers, subscriptions) started inside the effect.
 */
export type SignalEffect = () => void | CleanupFn;
/** Effect options */
export type EffectOptions = HmrOptions;
/** @internal Wrapper that re-runs `SignalEffect` and manages tracking; never itself returns a cleanup. */
type EffectExecutor = () => void;
/** @internal Tracks one Effect's subscriptions and the last cleanup it returned, if any. */
export type EffectTracking = Readonly<{execute: EffectExecutor; deps: Set<Set<EffectTracking>>}> & {
  userCleanup?: CleanupFn;
};
export type CleanupFn = () => void;
export type SignalUntrackFn<T> = () => T;
export type BatchUpdateFn<T> = () => T;
