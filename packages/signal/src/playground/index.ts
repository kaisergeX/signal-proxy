import {signalProxy} from '../core';
import {createComputed, createEffect, createSignal, unTrack} from '../utils';
import './style.css';

const log = console.log;

// const signal = signalProxy({prop1: 0, prop2: 1}, (key, value) => {
//   log('%c[signal proxy]', 'color:#0ea5e9', `change: ${key} = ${value}`);
//   if (key === 'prop2') {
//     log('prop2 updated - do sth with it');
//   }
// });
// signal.prop1 = Number.NEGATIVE_INFINITY;
// signal.prop2 = 68;

const [count, setCount] = createSignal(0);
const [count2, setCount2] = createSignal(10);
const [rerunTracking, rerunDependents] = createSignal(undefined, {equals: false});

// createEffect(() => {
//   log('count =', count(), 'count2 =', count2());
// });

// log('==========================================================\nBatching');
// // Expected result:
// // count = 0
// // count 2 = 10
// // count = 3
// // count 2 = 40
// createEffect(() => {
//   log('count =', count());
// });
// createEffect(() => {
//   log('count 2 =', count2());
// });
// batch(() => {
//   setCount(1);
//   batch(() => {
//     setCount(2);
//     setCount2(20);

//     batch(() => {
//       setCount(3);
//       setCount2(30);
//     });
//   });

//   setCount2(40);
// });
// log('==========================================================');

// createEffect(() => {
//   log('%c[signal]', 'color: #f9fafb; background-color: #0ea5e9;', `count = ${count()}`);

//   // Nested createEffect will be ignored and show warning in dev mode
//   createEffect(() => {
//     log('[nested] count =', count());
//   });
// });

// createEffect(() => {
//   log('%c[signal]', 'color: #f9fafb; background-color: #0ea5e9;', `count2 = ${count2()}`);
// });

const doubled = createComputed(
  (prev) => {
    log('%c[inside computed]', 'color:#f9fafb; background-color:#059669', 'prev =', prev);

    return count() * 2;
  },
  '123',
  {
    equals: (prev, next) => {
      console.log('equals', prev, next);

      return false;
    },
  },
);
// const doubled = createComputed(() => createComputed(() => count() * 2)() * 2);

createEffect(() => {
  log('%c[computed signal]', 'color:#f9fafb; background-color:#059669', `doubled = ${doubled()}`);
});

const cleanupComputedEffect = createEffect(() => {
  // log(
  //   '%c[computed signal]',
  //   'color:#f9fafb; background-color:#059669',
  //   `doubled = ${doubled()}`,
  // );
});

// createEffect(() => {
//   log(
//     '%c[unTracked computed result effect]',
//     'color:white; background-color:black',
//     `doubled = ${unTrack(() => doubled())}`,
//   );
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
`;

document.querySelector<HTMLButtonElement>('#counter')?.addEventListener('click', () => setCount((v) => v + 1));

document.querySelector<HTMLButtonElement>('#counter2')?.addEventListener('click', () => {
  // signal.prop2++;
  setCount2((v) => v + 1);
});

document
  .querySelector<HTMLButtonElement>('#stop-computed-signal-effect')
  ?.addEventListener('click', cleanupComputedEffect);

document.querySelector<HTMLButtonElement>('#signal-optout-compare')?.addEventListener('click', () => rerunDependents());

const codeBlockEle = document.querySelector<HTMLPreElement>('#codeblock')!;
createEffect(() => {
  codeBlockEle.innerHTML = JSON.stringify({count: count(), count2: count2()});
});
