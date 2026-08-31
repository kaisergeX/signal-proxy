import {countSignal, countSignal2} from './store';
import {
  // createEffect as unsafe_createEffect,
  unTrack,
  withHMR,
} from '../utils';

if (import.meta.hot) {
  import.meta.hot.accept(); // makes this module self-accept an in-place swap instead of a full reload
}
 
const log = console.log;

const [count] = countSignal;
const [count2] = countSignal2;

// WITHOUT withHMR, when this file HMR, old effect still existed. Use createEffect from util directly to see.
// unsafe_createEffect(() => log('count =', count()));

// Swap to withHMR, to confirm effect got cleaned up in HMR:
const {createEffect, createComputed} = withHMR(import.meta.hot);
createEffect(() => log('%c[signal]', 'color: #f9fafb; background-color: #0ea5e9;', `count = ${count()}`));

createEffect(() => {
  log('%c[signal]', 'color: #f9fafb; background-color: #0ea5e9;', `count2 = ${count2()}`);

  // Nested createEffect will be ignored and show warning in dev mode
  //   createEffect(() => {
  //     log('[nested] count =', count());
  //   });

  return () => {
    log('cleanup');
  };
});

// createEffect(() => {
//   log('count =', count(), 'count2 =', count2());
// });

const doubled = createComputed(
  (prev) => {
    log('%c[inside computed]', 'color:#f9fafb; background-color:#059669', 'prev =', prev);

    return count2() * 2;
  },
  '123',
  {
    equals: (prev, next) => {
      console.log('equals', prev, next);

      return false;
    },
  },
);

const cleanupComputedEffect = createEffect(() => {
  log('%c[computed signal]', 'color:#f9fafb; background-color:#059669', `doubled = ${doubled()}`);
});

createEffect(() => {
  log(
    '%c[unTracked computed result effect]',
    'color:white; background-color:black',
    `doubled = ${unTrack(() => doubled())}`,
  );
});

document
  .querySelector<HTMLButtonElement>('#stop-computed-signal-effect')
  ?.addEventListener('click', cleanupComputedEffect);
