import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client — email/password only.
 * No Grok broker, no OAuth popups.
 */
export const authClient = createAuthClient();

export const authEnabled = import.meta.env.VITE_AUTH_ENABLED !== "false";

export async function signOut(redirectTo = "/"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error(error.message ?? "Sign-out failed");
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}
