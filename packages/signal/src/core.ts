import type {ObjectAny, SignalProxyOptions, SignalUpdateCallback} from './types';

/** Create a Signal Proxy. It track a `initialValue` object that changes over time. */
export function signalProxy<T extends ObjectAny = ObjectAny>(
  initialValue: T,
  callback?: SignalUpdateCallback<T>,
  options: SignalProxyOptions<T> = {},
): T {
  if (typeof initialValue !== 'object' || initialValue === null || Array.isArray(initialValue)) {
    throw new TypeError('signalProxy requires an object value');
  }

  const shouldUpdate = options.shouldUpdate === undefined ? Object.is : options.shouldUpdate;
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop: keyof T, value, receiver) {
      if (
        !shouldUpdate || // always skip updating when false
        (typeof shouldUpdate === 'function' && !shouldUpdate(prop, target[prop], value))
      ) {
        return true;
      }

      const result = Reflect.set(target, prop, value, receiver);
      if (!result) return false;

      callback?.(prop, value);
      return result;
    },
  };

  return new Proxy(initialValue, handler);
}
