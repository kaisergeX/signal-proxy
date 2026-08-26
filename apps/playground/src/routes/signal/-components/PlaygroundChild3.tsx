import {useAnimateStateChange} from '@kaiverse/k/hooks';
import {createEffect, useComputed} from '@kaiverse/signal-react';
import {playgroundSignal} from '../-utils/store';
import {useRef} from 'react';

const [globalCount] = playgroundSignal;

createEffect(() => {
  console.log(
    '%c[createEffect] Child3',
    'color: #f9fafb; background-color: #0ea5e9;',
    `globalCount = ${globalCount()}`,
  );

  // test the effect nested warning.
  createEffect(() => {
    console.log(
      '%c[createEffect] Child3',
      'color: #f9fafb; background-color: #0ea5e9;',
      `globalCount = ${globalCount()}`,
    );
  });
});

const PlaygroundChild3 = () => {
  const doubledGlobalCount = useComputed(() => globalCount() * 2);

  const flashElement = useRef<HTMLSpanElement>(null);
  useAnimateStateChange({
    ref: flashElement,
    value: doubledGlobalCount(),
    keyframes: {opacity: [0.5, 0.2, 1]},
    options: 400,
  });

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 3</h3>

      <code className="my-4 block">
        Global count doubled value: <span ref={flashElement}>{doubledGlobalCount()}</span>
      </code>
    </div>
  );
};

export default PlaygroundChild3;
