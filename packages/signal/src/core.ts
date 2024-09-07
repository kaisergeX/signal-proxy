import type {ObjectAny, SignalCompareEqual, SignalUpdateCallback} from './types';

/** Create a Signal Proxy. It track a `initialValue` object that changes over time. */
export function signalProxy<T extends ObjectAny = ObjectAny>(
  initialValue: T,
  callback: SignalUpdateCallback<T>,
  equals: SignalCompareEqual<T> = Object.is,
): T {
  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (equals(target[prop] as T, value)) {
        return true;
      }

      const result = Reflect.set(target, prop, value, receiver);
      callback?.(prop, value);
      return result;
    },
  };

  return new Proxy(initialValue, handler);
}
