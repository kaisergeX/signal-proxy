import {batch, createEffect, createSignal} from '../utils';
import './consumer';
import {countSignal, countSignal2} from './store';
import './style.css';
// const {createEffect, createComputed} = withHMR(import.meta.hot);

const log = console.log;

// const signal = signalProxy(
//   {prop1: 0, prop2: 1},
//   (key, value) => {
//     log('%c[signal proxy]', 'color:#0ea5e9', `change: ${key} = ${value}`);
//     if (key === 'prop2') {
//       log('prop2 updated - do sth with it');
//     }
//   },
//   {
//     shouldUpdate: (property, currentValue, newValue) => {
//       log('shouldUpdate', property, currentValue, newValue, signal);
//       return true;
//     },
//   },
// );
// signal.prop1 = Number.NEGATIVE_INFINITY;
// log(signal);
// signal.prop2 = 68;
// log(signal);

const [count, setCount] = countSignal;
const [count2, setCount2] = countSignal2;
const [rerunTracking, rerunDependents] = createSignal(undefined, {equals: false});

// const doubled = createComputed(() => createComputed(() => count() * 2)() * 2);
// createEffect(() => {
//   log('%c[computed signal]', 'color:#f9fafb; background-color:#059669', `nested doubled = ${doubled()}`);
// });

createEffect(() => {
  rerunTracking();
  log('%c[effect]', 'color:white; background-color:black', 'effect rerun even if signal value unchanged');
});

/**
 * ================================================================================================
 * HTML setup
 * ================================================================================================
 */

document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
    <h1>Playground</h1>
    <pre id="codeblock"></pre>
    <button id="counter" type="button">counter ++</button>
    <button id="counter2" type="button">counter2 ++</button>
    <button id="stop-computed-signal-effect" type="button">Stop computed signal effect</button>
    <h3 style="margin-top:5rem">Rrigger effect even if Signals setter with value unchanged</h3>
    <button id="signal-optout-compare" type="button">Trigger effect</button>
    <h3 style="margin-top:5rem">Batching Test</h3>
    <button id="test-batching" type="button">Test Batching</button>
`;

document.querySelector<HTMLButtonElement>('#counter')?.addEventListener('click', () => setCount((v) => v + 1));

document.querySelector<HTMLButtonElement>('#counter2')?.addEventListener('click', () => {
  // signal.prop2++;
  setCount2((v) => v + 1);
});

document.querySelector<HTMLButtonElement>('#signal-optout-compare')?.addEventListener('click', () => rerunDependents());

const [batchTest, setBatchTest] = createSignal(0);
const [batchTest2, setBatchTest2] = createSignal(0);

// Add the batching test button functionality
document.querySelector<HTMLButtonElement>('#test-batching')?.addEventListener('click', () => {
  log('\n=== Test Batching Functionality ===');
  // Test batch with multiple mutations
  batch(() => {
    setBatchTest(10);
    setBatchTest2(batchTest2() + 1);
    setBatchTest2((v) => v + 1);

    batch(() => {
      setBatchTest2((v) => v + 2);
      setBatchTest(20);

      batch(() => {
        setBatchTest2((v) => v + 2);
        setBatchTest(30);
      });
    });
  });
});

createEffect(() => {
  log('Batching batchTest:', batchTest(), 'batchTest2:', batchTest2());
});

const codeBlockEle = document.querySelector<HTMLPreElement>('#codeblock')!;
createEffect(() => {
  codeBlockEle.innerHTML = JSON.stringify({count: count(), count2: count2()});
});
