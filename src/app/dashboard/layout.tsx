"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { DASH_NAV, HOSPITAL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setEmail("preview@surehealth.ng");
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      setEmail(data.user.email ?? "member");
    });
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-card md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <NavLink href="/" className="font-semibold">
            {HOSPITAL.program}
          </NavLink>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:grid md:gap-1 md:px-3" aria-label="Member">
          {DASH_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:bg-bg hover:text-fg"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center justify-between px-4 py-4 md:flex">
          <ThemeToggle />
        </div>
      </aside>
      <div>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="truncate text-sm text-muted">{email ?? "Loading member"}</p>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-primary"
          >
            Sign out
          </button>
        </div>
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
