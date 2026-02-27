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

  const path = window.location.pathname;
  const isPublicRoute = path === '/' || path.startsWith('/login') || path.startsWith('/signup');

  // If not authenticated and not on a public page, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" />;
  }

  // If authenticated and on login/signup, redirect to dashboard
  if (isAuthenticated && (path.startsWith('/login') || path.startsWith('/signup'))) {
    return <Navigate to="/dashboard" />;
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
