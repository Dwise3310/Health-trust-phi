"use client";

import { FormEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { PageHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  username: string;
  phone: string;
  avatar_url: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  state_of_origin: string;
  lga: string;
  address: string;
  blood_group: string;
  genotype: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  occupation: string;
  referral_code: string;
};

const EMPTY: Profile = {
  full_name: "",
  username: "",
  phone: "",
  avatar_url: "",
  date_of_birth: "",
  gender: "",
  nationality: "Nigeria",
  state_of_origin: "",
  lga: "",
  address: "",
  blood_group: "",
  genotype: "",
  next_of_kin_name: "",
  next_of_kin_phone: "",
  occupation: "",
  referral_code: "",
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-bg px-3 py-2.5 disabled:opacity-60"
      />
    </label>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [form, setForm] = useState<Profile>(EMPTY);
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [lockedUser, setLockedUser] = useState(false);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUid(user.id);
      setEmail(user.email || "");
      const { data: row } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (row) {
        setForm({
          full_name: row.full_name || "",
          username: row.username || "",
          phone: row.phone || "",
          avatar_url: row.avatar_url || "",
          date_of_birth: row.date_of_birth || "",
          gender: row.gender || "",
          nationality: row.nationality || "Nigeria",
          state_of_origin: row.state_of_origin || "",
          lga: row.lga || "",
          address: row.address || "",
          blood_group: row.blood_group || "",
          genotype: row.genotype || "",
          next_of_kin_name: row.next_of_kin_name || "",
          next_of_kin_phone: row.next_of_kin_phone || "",
          occupation: row.occupation || "",
          referral_code: row.referral_code || "",
        });
        setLockedUser(Boolean(row.username_locked));
      }
    });
  }, []);

  async function onPhoto(file: File) {
    const supabase = createClient();
    if (!supabase || !uid) return;
    const path = `${uid}/${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
    });
    if (error) {
      const reader = new FileReader();
      reader.onload = () => set("avatar_url", String(reader.result || ""));
      reader.readAsDataURL(file);
      toast("Photo kept on this device until storage is opened.");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    set("avatar_url", data.publicUrl);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !uid) {
      toast("Could not save the file right now. Try again.");
      return;
    }
    setBusy(true);
    const username = form.username.trim().toLowerCase();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        username: username || null,
        username_locked: lockedUser || Boolean(username),
        phone: form.phone,
        avatar_url: form.avatar_url,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        nationality: form.nationality,
        state_of_origin: form.state_of_origin,
        lga: form.lga,
        address: form.address,
        blood_group: form.blood_group,
        genotype: form.genotype,
        next_of_kin_name: form.next_of_kin_name,
        next_of_kin_phone: form.next_of_kin_phone,
        occupation: form.occupation,
      })
      .eq("id", uid);
    setBusy(false);
    if (error) {
      toast(error.message);
      return;
    }
    if (username) setLockedUser(true);
    toast("Patient file saved");
  }

  return (
    <main className="grid gap-8">
      <PageHeader eyebrow="Account" title="Patient file">
        This is the folder the desk will open. Age, next of kin, and blood group help the clinician before you sit down.
      </PageHeader>

      <form onSubmit={save} className="grid gap-8">
        <section className="flex items-center gap-4">
          <div className="grid size-20 place-items-center overflow-hidden rounded-full border border-border bg-bg">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-xl font-semibold">
                {(form.full_name || "M").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <label className="text-sm">
            <span className="font-medium">Profile photo</span>
            <input
              type="file"
              accept="image/*"
              className="mt-2 block text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onPhoto(file);
              }}
            />
          </label>
        </section>

        <div className="split" style={{ "--cols": 2 } as React.CSSProperties}>
          <section className="grid content-start gap-3">
            <h2 className="text-lg">Identity</h2>
            <Field label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
            <Field
              label="Username"
              value={form.username}
              disabled={lockedUser}
              onChange={(v) => set("username", v)}
            />
            <p className="text-xs text-muted">
              {lockedUser
                ? "Username is locked after the first save."
                : "Saved once, then it stays yours."}
            </p>
            <label className="grid gap-1.5 text-sm">
              Sign-in email
              <input
                value={email}
                readOnly
                className="rounded-xl border border-border bg-bg px-3 py-2.5 opacity-70"
              />
            </label>
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field
              label="Date of birth"
              type="date"
              value={form.date_of_birth}
              onChange={(v) => set("date_of_birth", v)}
            />
            <label className="grid gap-1.5 text-sm">
              Gender
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              >
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </select>
            </label>
            <Field label="Occupation" value={form.occupation} onChange={(v) => set("occupation", v)} />
          </section>

          <section className="grid content-start gap-3">
            <h2 className="text-lg">Place</h2>
            <Field label="Nationality" value={form.nationality} onChange={(v) => set("nationality", v)} />
            <Field
              label="State of origin"
              value={form.state_of_origin}
              onChange={(v) => set("state_of_origin", v)}
            />
            <Field label="LGA" value={form.lga} onChange={(v) => set("lga", v)} />
            <label className="grid gap-1.5 text-sm">
              Residential address
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              />
            </label>
          </section>
        </div>

        <section className="grid gap-3 border-t border-border pt-8">
          <h2 className="text-lg">Clinical notes the desk needs</h2>
          <div className="split" style={{ "--cols": 2 } as React.CSSProperties}>
            <div className="grid gap-3">
              <Field
                label="Blood group"
                value={form.blood_group}
                onChange={(v) => set("blood_group", v)}
              />
              <Field label="Genotype" value={form.genotype} onChange={(v) => set("genotype", v)} />
            </div>
            <div className="grid gap-3">
              <Field
                label="Next of kin"
                value={form.next_of_kin_name}
                onChange={(v) => set("next_of_kin_name", v)}
              />
              <Field
                label="Next of kin phone"
                value={form.next_of_kin_phone}
                onChange={(v) => set("next_of_kin_phone", v)}
              />
            </div>
          </div>
        </section>

        <ActionButton type="submit" variant="primary" size="lg" disabled={busy}>
          {busy ? "Saving" : "Save patient file"}
        </ActionButton>
      </form>
    </main>
  );
}
