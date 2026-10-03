import { PublicShell } from "@/components/public-shell";

export const metadata = { title: "Staff" };

export default function AdminPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-primary">Staff desk</p>
        <h1 className="mt-2 text-4xl">Eastern Ryse staff only</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Reception, pharmacy, clinicians, and trusted desk staff enter here.
          Super admin creates a role, attaches what that role may touch, then
          invites a hospital email into it. Members use the member desk, not
          this door.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The live staff tools (roles, invites, patient folders, Care Quota
          debit, and the audit log) are opening next on this same route.
        </p>
      </main>
    </PublicShell>
  );
}
