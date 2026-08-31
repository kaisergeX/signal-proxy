import {createSignal, type SignalFactoryReturnType} from '@kaiverse/signal';

// Reuse the same Signal instance across HMR updates so module-level destructuring and
// one-time React hook state (useComputed/useSignalEffect) don't end up subscribed to a dead instance.
export const playgroundSignal =
  (import.meta.hot?.data.playgroundSignal as SignalFactoryReturnType<number>) ?? createSignal(0);

if (import.meta.hot) {
  import.meta.hot.data.playgroundSignal = playgroundSignal;
  import.meta.hot.accept();
}
