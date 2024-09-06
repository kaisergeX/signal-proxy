import {signalProxy} from '../core';
import {createComputed, createEffect, createSignal, unTrack} from '../utils';
import './style.css';

const signal = signalProxy({prop1: 0, prop2: 1}, (key, value) => {
  console.log('%c[signal proxy]', 'color:#0ea5e9', `change: ${key} = ${value}`);
  if (key === 'prop2') {
    console.log('prop2 updated - do sth with it');
  }
});
signal.prop1 = Number.NEGATIVE_INFINITY;
signal.prop2 = 68;

const [count, setCount] = createSignal(0);
const [rerunTracking, rerunDependents] = createSignal(undefined, {equals: false});

createEffect(() => {
  console.log('%c[signal]', 'color: #f9fafb; background-color: #0ea5e9;', `value = ${count()}`);
});

const doubled = createComputed(() => count() * 2);

const cleanupComputedEffect = createEffect(() => {
  console.log(
    '%c[computed signal]',
    'color:#f9fafb; background-color:#059669',
    `doubled = ${doubled()}`,
  );
});

createEffect(() => {
  console.log(
    '%c[unTracked computed result effect]',
    'color:white; background-color:black',
    `doubled = ${unTrack(() => doubled())}`,
  );
});

createEffect(() => {
  rerunTracking();
  console.log(
    '%c[effect]',
    'color:white; background-color:black',
    'effect rerun even if signal value unchanged',
  );
});

/**
 * ================================================================================================
 * HTML setup
 * ================================================================================================
 */

document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
    <h1>Playground</h1>
    <pre id="codeblock"></pre>
    <button id="counter" type="button">Increase counter ++</button>
    <button id="stop-computed-signal-effect" type="button">Stop computed signal effect</button>
    <h3 style="margin-top:5rem">Signal setter with value unchanged still trigger effect</h3>
    <button id="signal-optout-compare" type="button">Trigger effect</button>
`;

document.querySelector<HTMLButtonElement>('#counter')?.addEventListener('click', () => {
  signal.prop2++;
  setCount((v) => v + 1);
});

document
  .querySelector<HTMLButtonElement>('#stop-computed-signal-effect')
  ?.addEventListener('click', cleanupComputedEffect);

document
  .querySelector<HTMLButtonElement>('#signal-optout-compare')
  ?.addEventListener('click', () => rerunDependents());

const codeBlockEle = document.querySelector<HTMLPreElement>('#codeblock')!;
createEffect(() => {
  codeBlockEle.innerHTML = `Signal value is ${count()}`;
});
