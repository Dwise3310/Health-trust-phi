export const SESSION_DAYS = 5;
export const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;

export const supabaseCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE,
};
