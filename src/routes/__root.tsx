import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { convex } from '@/lib/convex';
import { useConvexAuth } from 'convex/react';

function RootComponent() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login/signup page, redirect to login
  if (!isAuthenticated && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
}

export const Route = createRootRoute({
  component: () => (
    <ConvexAuthProvider client={convex}>
      <RootComponent />
    </ConvexAuthProvider>
  ),
});
