import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export const safeAnyToNumber = <T = unknown>(
  inputVal: Exclude<T, (...args: never) => unknown>,
  fallbackNum = 0,
) => {
  if (inputVal === null || typeof inputVal === 'symbol') {
    return fallbackNum;
  }

  const result = Number(inputVal);
  return isNaN(result) ? fallbackNum : result;
};

export const cn = (...className: ClassValue[]) => {
  return twMerge(clsx(className));
};
