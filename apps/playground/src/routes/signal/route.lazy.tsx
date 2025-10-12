import {useAnimateStateChange} from '@kaiverse/k/hooks';
import {useComputed, useSignal, useSignalEffect, useSyncSignal} from '@kaiverse/signal-react';
import {createLazyFileRoute, Link} from '@tanstack/react-router';
import {useRef, useState} from 'react';
import PlaygroundChild3 from './-components/PlaygroundChild3';
import {playgroundSignal} from './-utils/store';

export const Route = createLazyFileRoute('/signal')({
  component: SignalPlayground,
});

const [globalCount, setGlobalCount] = playgroundSignal;

function PlaygroundChild1() {
  const [multiple, setMultiple] = useSyncSignal(1);
  const [count, setCount] = useState(0);
  const isSafeInterger = Number.isSafeInteger(multiple());

  useSignalEffect(() => {
    console.log(
      '%c[useSignalEffect] Child1',
      'color:#059669',
      `Local Signal value = ${multiple()}`,
    );
  });

  useSignalEffect(() => {
    console.log(
      '%c[useSignalEffect] Child1',
      'color:white;background-color:#059669',
      `globalCount = ${globalCount()}`,
    );
  });

  // useEffect(() => {
  //   const signalRef = new WeakRef(signal);
  //   // const registry = new FinalizationRegistry((heldValue) => {
  //   //   console.log(`${heldValue} has been garbage collected`);
  //   // });
  //   // registry.register(signalRef, 'signalRef');

  //   const checkIfCollected = () => {
  //     const deref = signalRef.deref();

  //     console.log(
  //       deref === undefined ? 'The object has been garbage collected' : 'The object is still alive',
  //     );
  //   };

  //   checkIfCollected();
  //   return () => {
  //     console.log('unmounted');
  //     setTimeout(() => {
  //       checkIfCollected();
  //     }, 5000);
  //   };
  // }, []);

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 1</h3>
      <pre className="whitespace-pre-wrap py-4">
        {JSON.stringify({'Signal value': multiple(), 'State value': count}, null, 2)}
      </pre>

      <h2 className="mt-4 mb-2">Signal update:</h2>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="button"
          type="button"
          onClick={() => setMultiple((v) => v * 4)}
          disabled={!isSafeInterger}
        >
          {isSafeInterger ? 'Local multiplier 4x' : 'Greater than MAX_SAFE_INTEGER'}
        </button>
        <button
          className="button-secondary"
          type="button"
          onClick={() => setGlobalCount(globalCount() + 1)}
        >
          Global counter ++
        </button>
      </div>

      <h2 className="mt-4 mb-2">State update:</h2>
      <button className="button mr-2" type="button" onClick={() => setCount((c) => c + 1)}>
        State counter ++
      </button>
    </div>
  );
}

function PlaygroundChild2() {
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

function SignalPlayground() {
  return (
    <>
      <Link to="/other">Other page</Link>
      <div className="flex-center-between h-1/2 gap-4 p-4 *:flex-1">
        <PlaygroundChild1 />
        <PlaygroundChild2 />
        <PlaygroundChild3 />
      </div>
    </>
  );
}
