# Convex Authentication Setup

This project uses **@convex-dev/auth** for authentication with support for:
- 🔐 **Password Authentication** (email/password)
- 🌐 **Google OAuth** (social sign-in)

## ✅ What's Configured

The following has been set up for you:

1. **Package Installation**: `@convex-dev/auth` is installed
2. **Auth Configuration**: `convex/auth.ts` configures Password and Google OAuth providers
3. **HTTP Routes**: `convex/http.ts` exposes auth endpoints at `/api/auth/*`
4. **Schema Integration**: `convex/schema.ts` includes auth tables
5. **Provider Setup**: `<ConvexAuthProvider>` wraps the app in `src/main.tsx`
6. **Utility Exports**: `src/lib/auth.ts` exports useful auth hooks
7. **Convex Client**: `src/lib/convex.ts` configures the Convex React client

## 🔌 HTTP Routes Configuration

Convex Auth requires HTTP routes to be registered to handle authentication requests from your frontend. This is done in `convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Register authentication HTTP routes
// This exposes endpoints at /api/auth/* for signin, signup, OAuth callbacks, etc.
auth.addHttpRoutes(http);

export default http;
```

**Why is this required?**

Without this file, your frontend authentication requests have no backend endpoint to connect to. The `auth.addHttpRoutes(http)` call automatically creates all necessary endpoints:
- `/api/auth/signin` - Email/password sign in
- `/api/auth/signout` - Sign out
- `/api/auth/callback/google` - Google OAuth callback
- And other authentication-related endpoints

This is a **critical file** - authentication will not work without it.

## 🚀 Quick Start

### Using Password Authentication

The Password provider is ready to use immediately. No additional configuration needed!

```tsx
import { useAuthActions } from '@/lib/auth';

function SignUpForm() {
  const { signIn } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Sign up new user
    await signIn('password', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="name" placeholder="Full Name" />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Using Google OAuth (Requires Setup)

To enable Google sign-in, you need to:

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. For Application type, select **Web application**
7. Add **Authorized redirect URIs**:
   - Development: `http://localhost:5173/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
8. Click **Create** and copy the **Client ID** and **Client Secret**

#### 2. Add Credentials to Convex

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:
   - `AUTH_GOOGLE_ID`: Your Google OAuth Client ID
   - `AUTH_GOOGLE_SECRET`: Your Google OAuth Client Secret
5. Click **Save**

#### 3. Use Google Sign-In

```tsx
import { useAuthActions } from '@/lib/auth';

function GoogleSignInButton() {
  const { signIn } = useAuthActions();

  return (
    <button onClick={() => signIn('google')}>
      Sign in with Google
    </button>
  );
}
```

## 📖 Auth Hooks & Components

### `useAuthActions()`

The main hook for authentication actions:

```tsx
import { useAuthActions } from '@/lib/auth';

function MyComponent() {
  const {
    signIn,           // Function to sign in
    signOut,          // Function to sign out
    isAuthenticated,  // Boolean: is user signed in?
    isLoading,        // Boolean: is auth loading?
  } = useAuthActions();

  // Use these in your component
}
```

### `<Authenticated>` / `<Unauthenticated>`

Conditional rendering components:

```tsx
import { Authenticated, Unauthenticated } from '@/lib/auth';

function MyPage() {
  return (
    <>
      <Authenticated>
        <div>You are signed in!</div>
      </Authenticated>

      <Unauthenticated>
        <div>Please sign in</div>
      </Unauthenticated>
    </>
  );
}
```

### Get Current User Data

Query user data from your Convex backend:

```tsx
import { useQuery } from '@/lib/auth';
import { api } from '../../convex/_generated/api';

function UserProfile() {
  const user = useQuery(api.users.getCurrentUser);

  if (!user) return <div>Loading...</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

## 🔧 Environment Variables

Required environment variables (already set in `.env.local`):

```bash
# Convex deployment URL (required)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Google OAuth (optional - only if using Google sign-in)
# These are set in Convex Dashboard, not in .env files
# AUTH_GOOGLE_ID=your-google-client-id
# AUTH_GOOGLE_SECRET=your-google-client-secret
```

## 📝 Notes

- **Google OAuth credentials** are configured in the Convex Dashboard, NOT in local `.env` files
- The Password provider works out of the box without any additional configuration
- Auth state persists across page refreshes
- All auth data is stored securely in Convex tables

## 🆘 Troubleshooting

### "Missing VITE_CONVEX_URL" error
- Make sure `.env.local` exists and contains `VITE_CONVEX_URL`
- Restart the dev server after adding environment variables

### Google OAuth redirect not working
- Verify redirect URIs in Google Cloud Console match your app's URL
- Check that `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set in Convex Dashboard
- Ensure the variables are saved in the correct environment (dev/prod)

### Can't sign in with password
- Check browser console for errors
- Verify `convex dev` is running
- Ensure schema is pushed to Convex (auth tables exist)

## 📚 Additional Resources

- [Convex Auth Documentation](https://docs.convex.dev/auth)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
