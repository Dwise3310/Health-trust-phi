"use client";

import { FormEvent, useState } from "react";
import { NavLink } from "@/components/nav-link";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [locked, setLocked] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3) return;
    setLocked(true);
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Username is permanent once saved. Theme lives in this browser.
          Data deletion is a formal request, not a silent switch.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-border bg-card p-6"
      >
        <label className="grid gap-1.5 text-sm">
          Public username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={locked}
            minLength={3}
            className="rounded-xl border border-border bg-bg px-3 py-2.5 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={locked}
          className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-fg disabled:opacity-60"
        >
          {locked ? "Username locked" : "Save username"}
        </button>
      </form>
      <p className="text-sm">
        <NavLink href="/data-deletion" className="text-primary">
          Request data deletion
        </NavLink>
      </p>
    </main>
  );
}
