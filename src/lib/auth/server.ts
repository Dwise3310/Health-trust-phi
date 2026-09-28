/**
 * Standalone Better Auth for Health Trust.
 * Email + password only. No Grok broker, no shared OAuth.
 */
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { pgliteDialect } from "./pglite-dialect";

void ensureDbReady();

const globalAuthRef = globalThis as typeof globalThis & {
  __htAuthSecret__?: string;
};

function fallbackSecret(): string {
  globalAuthRef.__htAuthSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__htAuthSecret__;
}

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

const authDisabled = env("VITE_AUTH_ENABLED") === "false";
const explicitBaseURL = env("BETTER_AUTH_URL");

const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

const baseURL = explicitBaseURL ?? {
  allowedHosts: ["localhost", "127.0.0.1", "[::1]"],
  protocol: "auto" as const,
  fallback: "http://localhost:8080",
};

const trustedOrigins: string[] = explicitBaseURL
  ? [explicitBaseURL, ...LOCAL_DEV_ORIGINS]
  : LOCAL_DEV_ORIGINS;

const databaseUrl = env("DATABASE_URL");

const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "__Host-ht.session_token";

export const authConfigured = !authDisabled;

async function sendOtpEmail(to: string, code: string) {
  const apiKey = env("RESEND_API_KEY");
  const from = env("EMAIL_FROM") ?? "Health Trust <onboarding@resend.dev>";
  if (!apiKey) {
    console.log(`[Health Trust OTP] to=${to} code=${code}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Health Trust verification code",
      html: `<p>Your Health Trust verification code is:</p><p style="font-size:24px;font-weight:600;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes.</p>`,
    }),
  });
}

export const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? fallbackSecret(),
  database,
  trustedOrigins,
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: Boolean(env("RESEND_API_KEY")),
  },
  emailVerification: {
    sendOnSignUp: Boolean(env("RESEND_API_KEY")),
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      // Prefer short OTP when token looks usable as code; otherwise log full token
      const code = token.length <= 8 ? token : token.slice(0, 6).toUpperCase();
      await sendOtpEmail(user.email, code);
    },
  },
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-ht.session_data" },
      account_data: { name: "__Host-ht.account_data" },
      dont_remember: { name: "__Host-ht.dont_remember" },
    },
  },
  plugins: [bearer(), tanstackStartCookies()],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}
