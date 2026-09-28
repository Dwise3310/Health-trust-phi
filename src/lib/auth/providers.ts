/**
 * Social providers for this app.
 * Grok broker providers removed — project is fully independent.
 * Add direct Google OAuth here later when you have your own Client ID/Secret.
 */
export type SocialProvider = {
  providerId: string;
  label: string;
};

/** Empty until direct Google (or other) OAuth is configured. */
export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [];
