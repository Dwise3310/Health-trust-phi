import { PublicShell } from "./public-shell";

export function LegalLayout({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        {kicker ? <p className="text-sm text-primary">{kicker}</p> : null}
        <h1 className="mt-2 text-4xl">{title}</h1>
        <div className="mt-8 grid gap-4 text-sm leading-relaxed text-muted">
          {children}
        </div>
      </main>
    </PublicShell>
  );
}
