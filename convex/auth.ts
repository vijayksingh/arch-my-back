import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

/**
 * Convex Auth Configuration
 *
 * Providers:
 * - Password: Email/password authentication
 * - Google OAuth: Google sign-in
 *
 * Google OAuth Setup (Required):
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing project
 * 3. Enable Google+ API
 * 4. Go to "Credentials" -> "Create Credentials" -> "OAuth 2.0 Client ID"
 * 5. Configure OAuth consent screen if needed
 * 6. For "Application type", select "Web application"
 * 7. Add authorized redirect URIs:
 *    - For development: http://localhost:5173/api/auth/callback/google
 *    - For production: https://your-domain.com/api/auth/callback/google
 * 8. Copy the Client ID and Client Secret
 * 9. Add to Convex Dashboard (https://dashboard.convex.dev):
 *    - Go to your project -> Settings -> Environment Variables
 *    - Add: AUTH_GOOGLE_ID=<your-client-id>
 *    - Add: AUTH_GOOGLE_SECRET=<your-client-secret>
 *
 * Environment Variables Required:
 * - AUTH_GOOGLE_ID: Google OAuth Client ID
 * - AUTH_GOOGLE_SECRET: Google OAuth Client Secret
 */
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password,
    Google,
  ],
});
