import {useComputed} from '#hooks';
import {useAnimateStateChange} from '@kaiverse/k/hooks';
import {createComputed, createEffect} from '@kaiverse/signal';
import {useRef} from 'react';
import {playgroundSignal} from './store';

const [globalCount] = playgroundSignal;

createEffect(() => {
  console.log(
    '%c[createEffect] Child3',
    'color: #f9fafb; background-color: #0ea5e9;',
    `globalCount = ${globalCount()}`,
  );
});

const double = createComputed(() => globalCount() * 2);

createEffect(() => {
  console.log(
    '%c[double] double',
    'color: #f9fafb; background-color: #0ea5e9;',
    `double = ${double()}`,
  );
});

const PlaygroundChild3 = () => {
  const doubledGlobalCount = useComputed(() => globalCount() * 2);
  const element = useRef<HTMLElement>(null);
  useAnimateStateChange({
    ref: element,
    value: doubledGlobalCount(),
    keyframes: {opacity: [0.5, 0.2, 1]},
    options: 400,
  });

  return (
    <div>
      <h2>PlaygroundChild 3</h2>

      <pre>
        Global count doubled value: <strong ref={element}>{doubledGlobalCount()}</strong>
      </pre>
    </div>
  );
};

export default PlaygroundChild3;
