import {createLazyFileRoute} from '@tanstack/react-router';

export const Route = createLazyFileRoute('/other')({
  component: () => <div>Hello /other!</div>,
});
