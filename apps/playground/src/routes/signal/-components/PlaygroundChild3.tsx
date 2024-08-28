import {createEffect} from '@repo/signal';
import {playgroundSignal} from '../-utils/store';
import {useComputed} from '#hooks';

const [globalCount] = playgroundSignal;

createEffect(() => {
  console.log(
    '%c[createEffect] PlaygroundChild3',
    'color: #f9fafb; background-color: #0ea5e9;',
    `Global Signal value = ${globalCount()}`,
  );
});

const PlaygroundChild3 = () => {
  const computedCount = useComputed(globalCount);

  return (
    <div className="h-full rounded-lg p-4 shadow">
      <h3>PlaygroundChild 3</h3>

      <pre className="my-4">Global Signal value: {computedCount()}</pre>
    </div>
  );
};

export default PlaygroundChild3;
