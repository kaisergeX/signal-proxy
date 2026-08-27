import {useAnimateStateChange} from '@kaiverse/k/hooks';
import {batch, createEffect, createSignal, useComputed} from '@kaiverse/signal-react';
import {useRef, useState} from 'react';
import {playgroundSignal} from '../-utils/store';

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
  const [testSignal, setTestSignal] = createSignal(0);
  const [_, setComputedValue] = createSignal(0);

  const [executionCount, setExecutionCount] = useState(0);

  const testBatching = () => {
    let localExecutionCount = 0;

    // Create an effect to track how many times it executes
    createEffect(() => {
      localExecutionCount++;
      console.log(`[Batching Test] Effect executed ${localExecutionCount} times`);
      setComputedValue(testSignal() * 2);
      setExecutionCount(localExecutionCount);
    });

    console.log('[Batching Test] Before batch');

    // This should only execute the effect once
    batch(() => {
      setTestSignal(10);
      setTestSignal(20);
      setTestSignal(30);
    });

    console.log(`[Batching Test] After batch - effect executed ${localExecutionCount} times`);
  };

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

      <div className="mt-4">
        <h4>Batching Test:</h4>
        <button className="button mr-2" type="button" onClick={testBatching}>
          Run Batching Test
        </button>
        <p>Effect execution count: {executionCount}</p>
      </div>
    </div>
  );
};

export default PlaygroundChild3;
