import { NavLink } from "@/components/nav-link";
import { PublicShell } from "@/components/public-shell";

export default function NotFound() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm text-primary">404</p>
        <h1 className="mt-2 text-4xl">That page is not here</h1>
        <p className="mt-3 text-sm text-muted">
          The link may be old, or the page has moved. Head home or open
          sign in.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <NavLink
            href="/"
            className="rounded-full bg-primary px-4 py-2 text-sm text-primary-fg"
          >
            Home
          </NavLink>
          <NavLink
            href="/login"
            className="rounded-full border border-border px-4 py-2 text-sm"
          >
            Sign in
          </NavLink>
        </div>
      </main>
    </PublicShell>
  );
}
