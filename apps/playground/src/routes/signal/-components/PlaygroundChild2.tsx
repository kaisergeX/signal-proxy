import {useAnimateStateChange} from '@kaiverse/k';
import {useComputed, useSignal} from '@kaiverse/signal-react';
import {useRef} from 'react';
import {playgroundSignal} from '../-utils/store';

const [globalCount] = playgroundSignal;

export function PlaygroundChild2() {
  const computedGlobalCount = useComputed(globalCount);
  const [, forceRerender] = useSignal(undefined, {equals: false}); // same as useReducer((x) => x + 1, 0);
  console.log('PlaygroundChild2 rerendered');

  const flashElement = useRef<HTMLSpanElement>(null);
  useAnimateStateChange({
    ref: flashElement,
    value: computedGlobalCount(),
    keyframes: {opacity: [0.5, 0.2, 1]},
    options: 400,
  });

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 2</h3>

      <code className="my-4 block">
        Global Signal value: <span ref={flashElement}>{computedGlobalCount()}</span>
      </code>

      <button className="button mr-2" type="button" onClick={forceRerender}>
        Force rerender PlaygroundChild 2
      </button>
    </div>
  );
}
