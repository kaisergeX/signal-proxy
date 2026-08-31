import {createEffect, createSignal} from '../utils';

// --- scenario: effect A reads signalA, THEN (mid-body) triggers a set that

// synchronously re-runs effect B, THEN effect A reads signalC AFTER that point ---
const [signalA, setSignalA] = createSignal(0);
const [signalB, setSignalB] = createSignal(0);
const [signalC, setSignalC] = createSignal(0);

createEffect(() => console.log('B runs, reads signalB =', signalB()));

let aRunCount = 0;
createEffect(() => {
  aRunCount++;
  console.log('A runs, reads signalA =', signalA());
  setSignalB(aRunCount);
  console.log('A continues, reads signalC =', signalC());
});

console.log('\n--- changing signalC alone ---');
setSignalC(999);
console.log('\n--- changing signalA alone (should still work) ---');
setSignalA(1);

// Expected Output:
// B runs, reads signalB = 0
// A runs, reads signalA = 0
// B runs, reads signalB = 1
// A continues, reads signalC = 0

// --- changing signalC alone ---
// A runs, reads signalA = 0
// B runs, reads signalB = 2
// A continues, reads signalC = 999

// --- changing signalA alone (should still work) ---
// A runs, reads signalA = 1
// B runs, reads signalB = 3
// A continues, reads signalC = 999
