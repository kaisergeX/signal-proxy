import {createLazyFileRoute, Link} from '@tanstack/react-router';
import {PlaygroundChild1} from './-components/PlaygroundChild1';
import {PlaygroundChild2} from './-components/PlaygroundChild2';
import PlaygroundChild3 from './-components/PlaygroundChild3';

export const Route = createLazyFileRoute('/signal')({
  component: SignalPlayground,
});

function SignalPlayground() {
  return (
    <>
      <Link to="/other">Other page</Link>
      <div className="grid grid-cols-3 gap-4 p-4">
        <PlaygroundChild1 />
        <PlaygroundChild2 />
        <PlaygroundChild3 />
      </div>
    </>
  );
}
