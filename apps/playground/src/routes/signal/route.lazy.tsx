import {createLazyFileRoute} from '@tanstack/react-router';
import {playgroundSignal} from './-utils/store';
import PlaygroundChild3 from './-components/PlaygroundChild3';
import {useState} from 'react';
import {useSignal, useSignalEffect, useComputed} from '#hooks';

export const Route = createLazyFileRoute('/signal')({
  component: SignalPlayground,
});

const [globalCount, setGlobalCount] = playgroundSignal;

function PlaygroundChild1() {
  const [multiple, setMultiple] = useSignal(1);
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

  // @todo fix useSignal setter causing rerender twice on strict mode
  // const [_, forceRerender] = useSignal(undefined, {equals: false});
  // console.log('PlaygroundChild2 rerendered');

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 2</h3>

      <code className="my-4 block">Global Signal value: {computedGlobalCount()}</code>

      {/* <button className="button mr-2" type="button" onClick={() => forceRerender()}>
        Force rerender
      </button> */}
    </div>
  );
}

function SignalPlayground() {
  return (
    <div className="flex-center-between h-1/2 gap-4 p-4 *:flex-1">
      <PlaygroundChild1 />
      <PlaygroundChild2 />
      <PlaygroundChild3 />
    </div>
  );
}
