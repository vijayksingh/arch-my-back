/**
 * Convex Auth Utilities
 *
 * This file re-exports auth hooks and helpers from @convex-dev/auth/react
 * for easier importing throughout the application.
 *
 * Usage examples:
 *
 * 1. Check authentication status:
 * ```tsx
 * import { useAuthActions } from '@/lib/auth';
 *
 * function MyComponent() {
 *   const { isAuthenticated, isLoading } = useAuthActions();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please sign in</div>;
 *   return <div>Welcome!</div>;
 * }
 * ```
 *
 * 2. Sign in with password:
 * ```tsx
 * import { useAuthActions } from '@/lib/auth';
 *
 * function SignInForm() {
 *   const { signIn } = useAuthActions();
 *
 *   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 *     e.preventDefault();
 *     const formData = new FormData(e.currentTarget);
 *     await signIn('password', formData);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="email" type="email" placeholder="Email" required />
 *       <input name="password" type="password" placeholder="Password" required />
 *       <button type="submit">Sign In</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * 3. Sign in with Google OAuth:
 * ```tsx
 * import { useAuthActions } from '@/lib/auth';
 *
 * function GoogleSignIn() {
 *   const { signIn } = useAuthActions();
 *
 *   return (
 *     <button onClick={() => signIn('google')}>
 *       Sign in with Google
 *     </button>
 *   );
 * }
 * ```
 *
 * 4. Sign out:
 * ```tsx
 * import { useAuthActions } from '@/lib/auth';
 *
 * function SignOutButton() {
 *   const { signOut } = useAuthActions();
 *
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 * ```
 *
 * 5. Get current user:
 * ```tsx
 * import { Authenticated, Unauthenticated, useQuery } from '@/lib/auth';
 * import { api } from '../../convex/_generated/api';
 *
 * function UserProfile() {
 *   const user = useQuery(api.users.getCurrentUser);
 *
 *   return (
 *     <>
 *       <Authenticated>
 *         <div>Welcome, {user?.name}!</div>
 *       </Authenticated>
 *       <Unauthenticated>
 *         <div>Please sign in</div>
 *       </Unauthenticated>
 *     </>
 *   );
 * }
 * ```
 */

export { useAuthActions } from '@convex-dev/auth/react';

// Re-export auth components from convex/react
export { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

// Re-export convex hooks for convenience
export { useQuery, useMutation, useAction } from 'convex/react';
