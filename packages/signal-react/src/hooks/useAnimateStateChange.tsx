import {useEffect, useRef, type RefObject} from 'react';

type FlashElementHookOptions<T extends HTMLElement> = Readonly<{
  /**
   * The element to animate.
   * ___
   * If you don't wanna provide a ref, use the hook's returned `RefObject` to attach to the element.
   */
  ref?: RefObject<T>;
  /**
   * The animation will be triggered when this value changes. It uses `Object.is` to compare with the previous value.
   * ___
   * If `undefined` or not provided, the animation will not be triggered.
   */
  value?: unknown;
  /**
   * Whether to trigger the animation when the component is mounted.
   *
   * @default false
   */
  triggerOnMount?: boolean;
  /**
   * Either an array of keyframe objects, or a keyframe object whose properties are arrays of values to iterate over.
   *
   * Read more about [Keyframe Formats](https://developer.mozilla.org/docs/Web/API/Web_Animations_API/Keyframe_Formats).
   * ___
   * `keyframes` should be a constant. DO NOT change it at runtime, as the new one may not be applied.
   *
   * Why?: To avoid unexpected animation behavior since this hook animates the element when the `value` state changed (component rerendered).
   */
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null;
  /**
   * Either an integer representing the animation's duration (in milliseconds),
   * or an Object containing one or more timing properties described in the KeyframeEffect() options parameter
   * and/or [other options](https://developer.mozilla.org/docs/Web/API/Element/animate#options).
   * ___
   * *Note*: `options` should be a constant. DO NOT update it, as the new `options` may not be applied.
   */
  options?: number | KeyframeAnimationOptions;
}>;

/** Animate an element when state value change. */
export function useAnimateStateChange<T extends HTMLElement = HTMLElement>({
  ref,
  value,
  keyframes,
  options,
  triggerOnMount = false,
}: FlashElementHookOptions<T>): RefObject<T> {
  const isMountedRef = useRef(false);
  const internalRef = useRef<T>(null);
  const elementRef = ref ?? internalRef;
  const prevValueRef = useRef(triggerOnMount ? undefined : value);

  // useEffect(s) order here matters to avoid canceling the animation on mount (if `triggerOnMount` is true) in StrictMode and
  // to ensure only updating the previous value ref after everything else.
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (value === undefined || Object.is(value, prevValueRef.current)) {
      return;
    }

    const animation = elementRef.current?.animate(keyframes, options);
    return () => {
      if (isMountedRef.current) {
        // Avoid canceling the animation on mount in StrictMode.
        animation?.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOnMount, value]);

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return elementRef;
}
