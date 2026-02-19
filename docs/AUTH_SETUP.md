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

## ⚙️ Initial Configuration

**CRITICAL FIRST STEP:** Before authentication will work, you must run the Convex Auth configuration command:

```bash
npx @convex-dev/auth --web-server-url http://localhost:5173
```

This command:
- Sets the `SITE_URL` environment variable in your Convex deployment
- Generates JWT keys for authentication
- Creates the `convex/auth.config.ts` file
- Verifies your setup is correct

**You only need to run this once per deployment.** For production, run it again with your production URL:
```bash
npx @convex-dev/auth --web-server-url https://your-domain.com --prod
```

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

## 🆘 Troubleshooting & Common Issues

### **Critical: "Missing environment variable JWKS" Error**

**Symptoms:**
- Error in Convex logs: `Uncaught Error: Missing environment variable 'JWKS'`
- Requests to `/.well-known/jwks.json` fail
- Authentication hangs or doesn't complete

**Root Cause:**
The `npx @convex-dev/auth` CLI command didn't generate both required JWT environment variables (`JWT_PRIVATE_KEY` and `JWKS`).

**Solution:**
```bash
# Remove any incomplete keys
npx convex env remove JWT_PRIVATE_KEY
npx convex env remove JWKS

# Re-run the auth setup WITHOUT extra flags
npx @convex-dev/auth
```

**Important Notes:**
- Running with flags like `--web-server-url` and `--allow-dirty-git-state` may only generate `JWT_PRIVATE_KEY`
- Running the command WITHOUT flags generates BOTH `JWT_PRIVATE_KEY` and `JWKS` correctly
- You can verify with: `npx convex env list` (should show both variables)

**Verification:**
```bash
# Test the JWKS endpoint
curl https://your-deployment.convex.site/.well-known/jwks.json

# Should return JSON like:
# {"keys":[{"use":"sig","kty":"RSA","n":"...","e":"AQAB"}]}
```

### **"Client URL as null" Message (NOT an Error)**

**What it means:**
When running `npx convex dev`, you may see:
```
Client URL as null
```

**This is NORMAL and NOT an error!** The CLI is just logging that it's not tracking a client URL in your local `.env.local` file. The actual `SITE_URL` is stored in Convex Dashboard environment variables, not locally.

### **Missing HTTP Routes File**

**Symptoms:**
- Frontend auth requests get no response
- No endpoints at `/api/auth/*`
- Authentication never completes

**Solution:**
Ensure `convex/http.ts` exists and contains:
```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);
export default http;
```

### **Required Environment Variables Checklist**

**In Convex Dashboard** (Settings → Environment Variables):
- ✅ `SITE_URL` - Your frontend URL (e.g., `http://localhost:5173`)
- ✅ `JWT_PRIVATE_KEY` - Generated by `@convex-dev/auth` CLI
- ✅ `JWKS` - Generated by `@convex-dev/auth` CLI
- ⚠️ `AUTH_GOOGLE_ID` - Only if using Google OAuth
- ⚠️ `AUTH_GOOGLE_SECRET` - Only if using Google OAuth

**Verify all are set:**
```bash
npx convex env list
```

### Other Common Issues

#### "Missing VITE_CONVEX_URL" error
- Make sure `.env.local` exists and contains `VITE_CONVEX_URL`
- Restart the dev server after adding environment variables

#### Google OAuth redirect not working
- Verify redirect URIs in Google Cloud Console match your app's URL
- Check that `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set in Convex Dashboard
- Ensure the variables are saved in the correct environment (dev/prod)

#### Can't sign in with password
- Check browser console for errors
- Verify `convex dev` is running
- Ensure schema is pushed to Convex (auth tables exist)
- Verify JWKS endpoint is working (see above)

## 🎓 Lessons Learned - Convex Auth Gotchas

### 1. The Two-File Requirement

Convex Auth requires **TWO files** to work:
1. `convex/auth.ts` - Provider configuration (Password, Google, etc.)
2. `convex/http.ts` - HTTP route handlers (exposes `/api/auth/*` endpoints)

**Missing either file breaks authentication completely.** The frontend will make requests but get no response.

### 2. JWKS vs JWT_PRIVATE_KEY

The auth system needs **BOTH** environment variables:
- `JWT_PRIVATE_KEY` - Used to **sign** JWT tokens (backend)
- `JWKS` - Used to **verify** JWT tokens (public keys exposed at `/.well-known/jwks.json`)

**Common mistake:** Only having `JWT_PRIVATE_KEY` set. The CLI sometimes only generates one depending on flags used.

### 3. SITE_URL Configuration

The `SITE_URL` must be set in **Convex Dashboard** (not `.env.local`) and must match your frontend URL:
- Development: `http://localhost:5173` (or your dev port)
- Production: `https://your-domain.com`

**Why it matters:** This is used for OAuth redirects and authentication callbacks. Wrong URL = infinite loading.

### 4. CLI Command Variations

Different ways to run the CLI have different results:

```bash
# ❌ May only generate JWT_PRIVATE_KEY (incomplete)
npx @convex-dev/auth --web-server-url http://localhost:5173 --allow-dirty-git-state

# ✅ Generates BOTH JWT_PRIVATE_KEY and JWKS (complete)
npx @convex-dev/auth
```

**Best practice:** Run without extra flags unless specifically needed.

### 5. Environment Variable Locations

Confusing aspect: Different variables live in different places:

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_CONVEX_URL` | `.env.local` | Frontend needs to know Convex deployment URL |
| `SITE_URL` | Convex Dashboard | Backend needs to know frontend URL |
| `JWT_PRIVATE_KEY` | Convex Dashboard | Backend JWT signing |
| `JWKS` | Convex Dashboard | Public JWT verification keys |
| `AUTH_GOOGLE_*` | Convex Dashboard | OAuth provider credentials |

### 6. TypeScript Compilation

After creating `convex/http.ts`, always verify TypeScript:
```bash
pnpm tsc --noEmit
```

No output = success. Errors here mean your imports or types are wrong.

### 7. Debugging Authentication Issues

**Step-by-step debugging:**

1. **Verify JWKS endpoint works:**
   ```bash
   curl https://your-deployment.convex.site/.well-known/jwks.json
   ```
   Should return valid JSON, not an error.

2. **Check all environment variables:**
   ```bash
   npx convex env list
   ```
   Must show: `SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`

3. **Verify HTTP routes are registered:**
   - Check `convex/http.ts` exists
   - Contains `auth.addHttpRoutes(http)`
   - Has `export default http`

4. **Check Convex dev logs:**
   - Look for "Missing environment variable" errors
   - Ignore "Client URL as null" (that's normal)

5. **Test in browser console:**
   ```javascript
   // Should not hang forever
   fetch('https://your-deployment.convex.site/api/auth/signin')
   ```

## 📚 Additional Resources

- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Convex Auth GitHub](https://github.com/get-convex/convex-auth)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
