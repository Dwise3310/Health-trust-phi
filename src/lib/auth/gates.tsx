import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { authEnabled, signOut } from "./client";
import { hasGateSessionMarker } from "./gate-session-marker";
import { resolveSignInGateState } from "./sign-in-gate";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

const subscribeToNothing = () => () => {};
const noGateSessionOnServer = () => false;

export const SIGN_IN_PATH = "/login";

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}

export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}

export function SignInGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  const state = resolveSignInGateState({ isPending, hasUser: user !== null });
  if (state === "pending") return null;
  if (state === "signed_in") return <>{children}</>;
  return <>{fallback ?? <SignInButtons />}</>;
}

export function SignInButtons() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Link
        to="/login"
        className="w-full cursor-pointer rounded-md border border-neutral-300 px-4 py-2 text-center hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        Sign in with email
      </Link>
    </div>
  );
}

/** Compact identity chip for dashboard / header — avoids cramped name + sign-out row. */
export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const gateSession = useSyncExternalStore(
    subscribeToNothing,
    hasGateSessionMarker,
    noGateSessionOnServer,
  );
  if (!user) return null;

  const label = user.displayName ?? user.primaryEmail ?? "Account";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition hover:bg-border/40"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[7rem] truncate text-sm font-medium sm:inline">
          {label.split(" ")[0]}
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-medium">{label}</p>
              {user.primaryEmail ? (
                <p className="truncate text-xs text-muted">{user.primaryEmail}</p>
              ) : null}
            </div>
            <div className="p-1">
              <Link
                to="/dashboard"
                className="block rounded-lg px-3 py-2 text-sm hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              {authEnabled && !gateSession ? (
                <button
                  type="button"
                  disabled={signingOut}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-surface disabled:opacity-60"
                  onClick={() => {
                    setSigningOut(true);
                    void signOut().catch(() => setSigningOut(false));
                  }}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
