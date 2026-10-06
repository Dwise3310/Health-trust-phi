"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { DashDock, DashSidebar } from "@/components/dash-dock";
import { HeartbeatLoader } from "@/components/heartbeat-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { HOSPITAL } from "@/lib/constants";
import { SESSION_MAX_AGE } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";

const SEEN_KEY = "sh-last-seen";

type Mini = { name: string; avatar: string | null };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mini, setMini] = useState<Mini>({ name: "Member", avatar: null });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/login?next=/dashboard");
      return;
    }

    let dead = false;
    const client = supabase;

    async function boot() {
      const last = Number(localStorage.getItem(SEEN_KEY) || "0");
      if (last && Date.now() - last > SESSION_MAX_AGE * 1000) {
        await client.auth.signOut();
        if (!dead) router.replace("/login?next=/dashboard");
        return;
      }
      localStorage.setItem(SEEN_KEY, String(Date.now()));

      const { data } = await client.auth.getSession();
      if (dead) return;
      if (!data.session) {
        router.replace("/login?next=/dashboard");
        return;
      }
      const uid = data.session.user.id;
      const { data: profile } = await client
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (!dead) {
        setMini({
          name: profile?.full_name || profile?.username || "Member",
          avatar: profile?.avatar_url || null,
        });
        setReady(true);
      }
    }

    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login?next=/dashboard");
    });

    const tick = setInterval(() => {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    }, 60_000);

    boot();
    return () => {
      dead = true;
      sub.subscription.unsubscribe();
      clearInterval(tick);
    };
  }, [router]);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(SEEN_KEY);
    router.replace("/");
    router.refresh();
  }

  if (!ready) {
    return (
      <div
        className="grid min-h-screen place-items-center"
        style={{
          background: "var(--overlay)",
          backdropFilter: "blur(14px)",
        }}
      >
        <HeartbeatLoader label="Opening your desk" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-fg">
              SH
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">{HOSPITAL.program}</span>
              <span className="block text-[11px] text-muted">Member desk</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AccountMenu name={mini.name} avatarUrl={mini.avatar} onSignOut={signOut} />
          </div>
        </div>
      </header>

      <div className="lg:flex">
        <DashSidebar />
        <div className="min-w-0 flex-1">
          <div className="sticky top-0 z-40 hidden items-center justify-between border-b border-border bg-bg/90 px-8 py-3 backdrop-blur-md lg:flex">
            <p className="text-sm text-muted">{mini.name}</p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AccountMenu name={mini.name} avatarUrl={mini.avatar} onSignOut={signOut} />
            </div>
          </div>
          <div
            key={pathname}
            className="tab-in mx-auto w-full max-w-5xl px-4 pb-32 pt-6 lg:px-8 lg:pb-12 lg:pt-8"
          >
            {children}
          </div>
        </div>
      </div>
      <DashDock />
    </div>
  );
}
