import {
  createRootRoute,
  Link,
  Outlet,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: RootPage,
  notFoundComponent: () => (
    <div>
      <p>404 | Page not found!</p>
      <Link to="/">🏡 Go home</Link>
    </div>
  ),
  errorComponent: RootErrorComponent,
});

function RootPage() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
}

function RootErrorComponent({error}: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div className="h-dvh content-center text-center">
      {error.message}
      <div className="flex-center mt-4 gap-4">
        <button
          className="button-secondary"
          type="button"
          onClick={() => router.invalidate()} // Invalidate the route to reload the loader, and reset any router error boundaries
        >
          Retry
        </button>
        <Link to="/" className="button">
          🏡 Go home
        </Link>
      </div>
    </div>
  );
}
