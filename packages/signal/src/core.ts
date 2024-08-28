import type {ObjectAny, SignalCompareEqual, SignalUpdateCallback} from './types';

export function signalProxy<T extends ObjectAny = ObjectAny>(
  target: T,
  callback: SignalUpdateCallback<T>,
  equals: SignalCompareEqual<T> = Object.is,
) {
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

  return new Proxy(target, handler);
}
