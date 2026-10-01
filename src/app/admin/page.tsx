import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Staff" };

export default function AdminPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Staff desk</p>
        <h1 className="mt-2 text-4xl">Roles, then people</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Super admin creates a role, attaches permissions (wallet view,
          reception, pharmacy, clinician notes, audit), then invites a
          trusted staff email into that role. New roles can be born at any
          time. Nothing is hard-coded to one job title forever.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The SQL pack creates roles, permissions, invites, patient
          folders, and an append-only audit log. Wire the invite mailer
          after Supabase is connected.
        </p>
      </main>
    </PublicShell>
  );
}
