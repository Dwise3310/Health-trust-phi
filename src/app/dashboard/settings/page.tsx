"use client";

import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { NavLink } from "@/components/nav-link";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [locked, setLocked] = useState(false);
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);
      setEmail(data.user.email || "");
      const { data: row } = await supabase
        .from("profiles")
        .select("username, username_locked, phone, notify_email, notify_sms")
        .eq("id", data.user.id)
        .maybeSingle();
      if (row) {
        setUsername(row.username || "");
        setLocked(Boolean(row.username_locked));
        setPhone(row.phone || "");
        setNotifyEmail(row.notify_email !== false);
        setNotifySms(Boolean(row.notify_sms));
      }
    });
  }, []);

  async function saveUsername(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const value = username.trim().toLowerCase();
    if (!supabase || !uid) {
      toast("Could not save right now. Try again.");
      return;
    }
    if (value.length < 3) {
      toast("Username needs at least 3 characters.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ username: value, username_locked: true })
      .eq("id", uid);
    if (error) {
      toast(error.message.includes("duplicate") ? "That username is taken." : error.message);
      return;
    }
    setLocked(true);
    toast("Username locked");
  }

  async function savePrefs(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        notify_email: notifyEmail,
        notify_sms: notifySms,
      })
      .eq("id", uid);
    toast(error ? error.message : "Preferences saved");
  }

  async function sendReset() {
    const supabase = createClient();
    if (!supabase || !email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    toast(error ? error.message : "Reset mail sent if the address is valid.");
  }

  return (
    <main className="grid gap-8">
      <PageHeader eyebrow="Account" title="Settings">
        Username is permanent once saved. Theme lives in this browser. Sign out is on the avatar.
      </PageHeader>

      <div className="split" style={{ "--cols": 2 } as React.CSSProperties}>
        <form onSubmit={saveUsername} className="grid content-start gap-3">
          <h2 className="text-lg">Public username</h2>
          <label className="grid gap-1.5 text-sm">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={locked}
              minLength={3}
              className="rounded-xl border border-border bg-bg px-3 py-2.5 disabled:opacity-60"
            />
          </label>
          <ActionButton type="submit" variant="primary" disabled={locked}>
            {locked ? "Username locked" : "Save username"}
          </ActionButton>
        </form>

        <form onSubmit={savePrefs} className="grid content-start gap-3">
          <h2 className="text-lg">Contact and alerts</h2>
          <label className="grid gap-1.5 text-sm">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-border bg-bg px-3 py-2.5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
            />
            Email notices for bookings and wallet
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifySms}
              onChange={(e) => setNotifySms(e.target.checked)}
            />
            SMS notices (when the SMS rail is live)
          </label>
          <ActionButton type="submit" variant="primary">
            Save preferences
          </ActionButton>
        </form>
      </div>

      <section className="grid gap-3 border-t border-border pt-8">
        <h2 className="text-lg">Account</h2>
        <ul className="rows text-sm">
          <li>
            <ActionButton variant="secondary" onClick={sendReset}>
              Send password reset
            </ActionButton>
          </li>
          <li>
            <NavLink href="/data-deletion" className="font-semibold text-primary">
              Request data deletion
            </NavLink>
          </li>
          <li>
            <NavLink href="/unsubscribe" className="font-semibold text-primary">
              Unsubscribe from marketing
            </NavLink>
          </li>
        </ul>
      </section>
    </main>
  );
}
