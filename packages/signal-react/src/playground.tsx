import {useComputed, useSignal, useSignalEffect, useSyncSignal} from '#hooks';
import {useState} from 'react';
import {playgroundSignal} from './store';
import PlaygroundChild3 from './playground-child-3';
import {useAnimateStateChange} from './hooks';

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
    <div>
      <h2>PlaygroundChild 1</h2>
      <pre>{JSON.stringify({'Signal value': multiple(), 'State value': count}, null, 2)}</pre>

      <h3>Signal update:</h3>
      <div className="flex" style={{flexWrap: 'wrap'}}>
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

      <h3>State update:</h3>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        State counter ++
      </button>
    </div>
  );
}

function PlaygroundChild2() {
  const computedGlobalCount = useComputed(globalCount);
  const [, forceRerender] = useSignal(undefined, {equals: false});
  console.log('PlaygroundChild2 rerendered');

  const flashElement = useAnimateStateChange({
    value: computedGlobalCount(),
    keyframes: {color: ['#86efac', 'inherit']},
    options: 400,
  });

  return (
    <div>
      <h2>PlaygroundChild 2</h2>

      <pre>
        Global Signal value: <strong ref={flashElement}>{computedGlobalCount()}</strong>
      </pre>

      <button type="button" onClick={() => forceRerender()}>
        Force rerender PlaygroundChild 2
      </button>
    </div>
  );
}

function SignalPlayground() {
  return (
    <div className="playground">
      <PlaygroundChild1 />
      <PlaygroundChild2 />
      <PlaygroundChild3 />
    </div>
  );
}

export default SignalPlayground;
