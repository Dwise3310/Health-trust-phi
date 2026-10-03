"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseCookieOptions } from "@/lib/session";
import { getSupabasePublicEnv } from "./env";

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey, {
    cookieOptions: supabaseCookieOptions,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
