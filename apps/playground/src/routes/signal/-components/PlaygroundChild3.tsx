import {createEffect} from '@kaiverse/signal';
import {playgroundSignal} from '../-utils/store';
import {useComputed} from '#hooks';

const [globalCount] = playgroundSignal;

createEffect(() => {
  console.log(
    '%c[createEffect] Child3',
    'color: #f9fafb; background-color: #0ea5e9;',
    `globalCount = ${globalCount()}`,
  );
});

const PlaygroundChild3 = () => {
  const doubledGlobalCount = useComputed(() => globalCount() * 2);

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 3</h3>

      <code className="my-4 block">Global count doubled value: {doubledGlobalCount()}</code>
    </div>
  );
};

export default PlaygroundChild3;
