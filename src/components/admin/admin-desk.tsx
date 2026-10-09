"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { HeartbeatLoader } from "@/components/heartbeat-loader";
import { StatusChip, statusTone } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ADMIN_NAV, ADMIN_PERMISSIONS, canSee, type AdminSection, type AdminStatus } from "@/lib/admin";
import { HEALTH_TO_NAIRA } from "@/lib/constants";
import { formatHealth, formatNaira } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type QueueRow = {
  id: number;
  kind: string;
  user_id: string | null;
  member: string;
  email: string;
  phone: string;
  tier: string;
  title: string;
  detail: string | null;
  amount: number | null;
  status: string;
  reply: string | null;
  created_at: string;
};

type Analytics = {
  from: string;
  to: string;
  total_users: number;
  new_users: number;
  dau: number;
  mau: number;
  active_in_range: number;
  views: number;
  unique_members: number;
  revenue_health: number;
  sales_count: number;
  deposits_health: number;
  withdraw_health: number;
  open_withdrawals: number;
  open_pharmacy: number;
  open_visits: number;
  open_cards: number;
  open_enquiries: number;
  tiers: { base: number; plus: number; prime: number };
  days: { day: string; views: number; signups: number; revenue: number; deposits: number; sales: number }[];
};

type CodeHit = {
  code: string;
  status: string;
  allocated: number;
  remaining: number;
  issued_at: string;
  member: string;
  email: string;
  phone: string;
  tier: string;
  plan_quota: number | null;
  account_number: string | null;
  user_id: string;
};

type PatientSum = {
  id: string;
  member: string;
  email: string;
  phone: string;
  tier: string;
  balance: number;
  account_number: string | null;
};

type PatientFolder = {
  id: string;
  member: string;
  email: string;
  phone: string;
  username: string | null;
  dob: string | null;
  gender: string | null;
  nationality: string | null;
  state: string | null;
  address: string | null;
  blood_group: string | null;
  genotype: string | null;
  kin: string | null;
  kin_phone: string | null;
  balance: number;
  account_number: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_account_name: string | null;
  tier: string | null;
  quota: number | null;
  expires: string | null;
  codes: { code: string; allocated: number; remaining: number; status: string; issued_at: string }[];
  visits: { kind: string; when: string; minutes: number; status: string; cost: number; notes: string | null }[];
  tx: { amount: number; kind: string; note: string | null; at: string }[];
};

type RoleRow = { id: number; name: string; permissions: string[] };
type StaffRow = { user_id: string; email: string; name: string; role_id: number; role_name: string; active: boolean };
type InviteRow = { id: number; email: string; role_name: string; accepted: boolean; created_at: string };
type RolesPayload = { roles: RoleRow[]; staff: StaffRow[]; invites: InviteRow[] };
type AuditRow = { actor_username: string; action: string; details: string; created_at: string };

const QUEUE_COPY: Record<string, { title: string; lead: string; done: string; extra?: string }> = {
  withdraw: {
    title: "Withdrawals",
    lead: "Health has already left the wallet. Mark paid after the bank transfer, or reject to put the Health back.",
    done: "Mark paid",
    extra: "rejected",
  },
  visit: {
    title: "Visits and calls",
    lead: "Prime is listed before Plus, then Base. Confirm when the member is expected, then mark the visit done.",
    done: "Mark done",
  },
  pharmacy: {
    title: "Pharmacy",
    lead: "Paid orders waiting for the dispensary. Mark dispensed when the medicine has left the shelf.",
    done: "Mark dispensed",
  },
  card: {
    title: "Appointment cards",
    lead: "Digital cards bought on the phone. Mark collected when reception has honoured the card.",
    done: "Mark collected",
  },
  enquiry: {
    title: "Enquiries",
    lead: "Messages from the public contact form. Write a reply, then save it on the record.",
    done: "Save reply",
  },
  deletion: {
    title: "Data deletion",
    lead: "People who asked for their record to be removed. Mark completed after the desk has done it.",
    done: "Mark completed",
  },
};

function money(n: number | null | undefined) {
  const v = Number(n || 0);
  return `${formatHealth(v)} · ${formatNaira(v * HEALTH_TO_NAIRA)}`;
}

function when(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function rpc<T>(name: string, args?: Record<string, unknown>) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not connected");
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export function AdminDesk({ status, onSignOut }: { status: AdminStatus; onSignOut: () => void }) {
  const nav = useMemo(
    () => ADMIN_NAV.filter((item) => canSee(status, item.perm)),
    [status],
  );
  const [section, setSection] = useState<AdminSection>(nav[0]?.id || "analytics");
  const [nextPassword, setNextPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!nav.some((item) => item.id === section) && nav[0]) setSection(nav[0].id);
  }, [nav, section]);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) toast(error.message);
    else {
      setNextPassword("");
      toast("Password updated");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Staff sections">
        {nav.map((item) => {
          const on = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 border-b-2 px-2 py-2 text-left text-sm lg:border-b-0 lg:border-l-2 ${
                on ? "border-primary font-semibold text-fg" : "border-transparent text-muted"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {status.super ? "Super admin" : "Staff"} · {status.email}
            </p>
            <p className="text-lg font-semibold">{status.name}</p>
          </div>
          <button type="button" className="text-sm font-semibold text-primary" onClick={onSignOut}>
            Sign out
          </button>
        </div>

        <div key={section} className="tab-in">
          {section === "analytics" ? <AnalyticsPane /> : null}
          {section === "withdraw" || section === "visit" || section === "pharmacy" || section === "card" || section === "enquiry" || section === "deletion" ? (
            <QueuePane kind={section} />
          ) : null}
          {section === "reception" ? <ReceptionPane /> : null}
          {section === "patients" ? <PatientsPane /> : null}
          {section === "roles" ? <RolesPane superAdmin={Boolean(status.super)} /> : null}
          {section === "logo" ? <LogoPane /> : null}
          {section === "audit" ? <AuditPane /> : null}
        </div>

        <form onSubmit={changePassword} className="mt-10 grid max-w-sm gap-2 border-t border-border pt-6">
          <p className="text-sm font-semibold">Change your password</p>
          <input
            type="password"
            minLength={8}
            required
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded-xl border border-border bg-bg px-3 py-2.5 text-sm"
            placeholder="New password"
          />
          <button type="submit" className="btn-press w-fit text-sm font-semibold text-primary">
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function AnalyticsPane() {
  const { toast } = useToast();
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<Analytics | null>(null);
  const [busy, setBusy] = useState(true);

  async function load(start = from, end = to) {
    setBusy(true);
    try {
      setData(await rpc<Analytics>("sh_admin_analytics", { p_from: start, p_to: end }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Analytics failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // initial range only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const peak = Math.max(1, ...(data?.days || []).map((d) => Number(d.revenue) || 0));

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Revenue is Health spent on plans, pharmacy, cards, and visits. Deposits are wallet funding, including the test credits while you are still in test mode. DAU and MAU count members who actually opened the site.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className="grid gap-1 text-xs text-muted">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg" />
        </label>
        <button type="submit" className="btn-press rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
          Apply range
        </button>
      </form>
      {busy || !data ? (
        <HeartbeatLoader label="Reading the books" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
            <Stat label="People" value={String(data.total_users)} hint={`${data.new_users} new in range`} />
            <Stat label="DAU" value={String(data.dau)} hint="Opened the site today" />
            <Stat label="MAU" value={String(data.mau)} hint="Distinct members, last 30 days" />
            <Stat label="Active in range" value={String(data.active_in_range)} />
            <Stat label="Page views" value={String(data.views)} hint={`${data.unique_members} signed-in viewers`} />
            <Stat label="Revenue" value={formatHealth(Number(data.revenue_health))} hint={formatNaira(Number(data.revenue_health) * HEALTH_TO_NAIRA)} />
            <Stat label="Sales" value={String(data.sales_count)} hint="Plans, pharmacy, cards, visits" />
            <Stat label="Deposits" value={formatHealth(Number(data.deposits_health))} hint={`Withdrawals ${formatHealth(Number(data.withdraw_health))}`} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span>Base {data.tiers?.base || 0}</span>
            <span>Plus {data.tiers?.plus || 0}</span>
            <span>Prime {data.tiers?.prime || 0}</span>
            <span>Open withdrawals {data.open_withdrawals}</span>
            <span>Pharmacy {data.open_pharmacy}</span>
            <span>Visits {data.open_visits}</span>
            <span>Cards {data.open_cards}</span>
            <span>Enquiries {data.open_enquiries}</span>
          </div>
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Revenue by day</p>
            {(data.days || []).map((day) => (
              <div key={day.day} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 text-xs">
                <span className="text-muted">{day.day.slice(5)}</span>
                <span className="h-1.5 rounded-full bg-border">
                  <span
                    className="block h-1.5 rounded-full bg-primary"
                    style={{ width: Number(day.revenue) > 0 ? `${Math.max(4, (Number(day.revenue) / peak) * 100)}%` : "0%" }}
                  />
                </span>
                <span className="tabular-nums text-muted">
                  {Number(day.revenue)} · {day.sales} sales · {day.views} views
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function QueuePane({ kind }: { kind: string }) {
  const { toast } = useToast();
  const copy = QUEUE_COPY[kind];
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [filter, setFilter] = useState("open");
  const [busy, setBusy] = useState(true);
  const [reply, setReply] = useState<Record<number, string>>({});

  async function load(status = filter) {
    setBusy(true);
    try {
      const data = await rpc<QueueRow[]>("sh_admin_queue", { p_kind: kind, p_status: status });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not load the queue");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setFilter("open");
    void load("open");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function act(id: number, status: string) {
    try {
      await rpc("sh_admin_act", { p_id: id, p_status: status, p_reply: reply[id] || "" });
      toast(status === "rejected" ? "Returned to the wallet" : "Saved");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update");
    }
  }

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-3xl">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{copy.lead}</p>
      </div>
      <div className="flex gap-3 text-sm">
        {["open", "done", "all"].map((id) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "font-semibold text-fg" : "text-muted"}
            onClick={() => {
              setFilter(id);
              void load(id);
            }}
          >
            {id === "all" ? "All" : id === "open" ? "Waiting" : "Closed"}
          </button>
        ))}
      </div>
      {busy ? <HeartbeatLoader label="Loading the queue" /> : null}
      {!busy && rows.length === 0 ? <p className="text-sm text-muted">Nothing in this list.</p> : null}
      <ul className="grid">
        {rows.map((row) => (
          <li key={row.id} className="grid gap-2 border-b border-border py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{row.member}</p>
              <StatusChip label={row.tier} tone={row.tier === "prime" ? "ok" : "muted"} />
              <StatusChip label={row.status} tone={statusTone(row.status)} />
              <span className="text-xs text-muted">{when(row.created_at)}</span>
            </div>
            <p className="text-sm">{row.title}</p>
            {row.detail ? <p className="whitespace-pre-wrap text-sm text-muted">{row.detail}</p> : null}
            <p className="text-xs text-muted">
              {row.email} {row.phone ? `· ${row.phone}` : ""} {row.amount != null ? `· ${money(row.amount)}` : ""}
            </p>
            {row.reply ? <p className="text-sm">Reply: {row.reply}</p> : null}
            {row.status === "open" || row.status === "confirmed" ? (
              <div className="flex flex-wrap items-center gap-2">
                {kind === "enquiry" ? (
                  <input
                    value={reply[row.id] || ""}
                    onChange={(e) => setReply((m) => ({ ...m, [row.id]: e.target.value }))}
                    placeholder="Reply for the record"
                    className="min-w-[16rem] flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                  />
                ) : null}
                {kind === "visit" && row.status === "open" ? (
                  <button type="button" className="text-sm font-semibold text-primary" onClick={() => void act(row.id, "confirmed")}>
                    Confirm
                  </button>
                ) : null}
                <button type="button" className="text-sm font-semibold text-primary" onClick={() => void act(row.id, kind === "enquiry" ? "replied" : "done")}>
                  {copy.done}
                </button>
                {kind === "withdraw" ? (
                  <button type="button" className="text-sm font-semibold text-danger" onClick={() => void act(row.id, "rejected")}>
                    Reject and refund
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReceptionPane() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [hit, setHit] = useState<CodeHit | null>(null);
  const [used, setUsed] = useState("5");
  const [note, setNote] = useState("");

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    try {
      setHit(await rpc<CodeHit>("sh_admin_lookup_code", { p_code: code }));
    } catch (err) {
      setHit(null);
      toast(err instanceof Error ? err.message : "No code");
    }
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    try {
      const next = await rpc<CodeHit>("sh_admin_use_code", {
        p_code: code,
        p_percent: Number(used),
        p_note: note,
      });
      setHit(next);
      setNote("");
      toast("Code updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update the code");
    }
  }

  return (
    <section className="grid max-w-xl gap-4">
      <div>
        <h1 className="text-3xl">Reception</h1>
        <p className="mt-2 text-sm text-muted">
          When a member walks in, check the Care Quota code they were given. Prime, Plus, and Base show here so the waiting room can seat them in the right place. Recording a use takes that percent off the code.
        </p>
      </div>
      <form className="flex gap-2" onSubmit={lookup}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SH- code"
          className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 font-mono"
        />
        <button type="submit" className="btn-press rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
          Check
        </button>
      </form>
      {hit ? (
        <div className="grid gap-2 border-b border-border pb-4 text-sm">
          <p className="font-semibold">{hit.member}</p>
          <p className="text-muted">{hit.email} {hit.phone ? `· ${hit.phone}` : ""}</p>
          <p>Plan {hit.tier} · plan quota left {hit.plan_quota ?? "none"}%</p>
          <p>Code {hit.code} · {hit.remaining}% left of {hit.allocated}% · {hit.status}</p>
          <p className="text-muted">Funding account {hit.account_number || "none"} · issued {when(hit.issued_at)}</p>
          <form className="mt-2 grid gap-2" onSubmit={redeem}>
            <label className="grid gap-1 text-xs text-muted">
              Percent used at the desk
              <input value={used} onChange={(e) => setUsed(e.target.value)} inputMode="decimal" className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg" />
            </label>
            <label className="grid gap-1 text-xs text-muted">
              What it covered
              <input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg" />
            </label>
            <button type="submit" className="btn-press w-fit text-sm font-semibold text-primary">
              Record use
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function PatientsPane() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [list, setList] = useState<PatientSum[]>([]);
  const [folder, setFolder] = useState<PatientFolder | null>(null);
  const [busy, setBusy] = useState(true);

  async function search(query = q) {
    setBusy(true);
    try {
      const data = await rpc<PatientSum[]>("sh_admin_patients", { p_query: query });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void search("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function open(id: string) {
    try {
      setFolder(await rpc<PatientFolder>("sh_admin_patient", { p_id: id }));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not open the folder");
    }
  }

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-3xl">Patients</h1>
        <p className="mt-2 text-sm text-muted">
          Search by name, email, phone, funding account, or Care Quota code. The folder is the chart the desk works from.
        </p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm" placeholder="Search" />
        <button type="submit" className="btn-press rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">Search</button>
      </form>
      {busy ? <HeartbeatLoader label="Finding members" /> : null}
      <ul>
        {list.map((p) => (
          <li key={p.id} className="border-b border-border">
            <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => void open(p.id)}>
              <span>
                <span className="block font-semibold">{p.member}</span>
                <span className="text-xs text-muted">{p.email || p.phone || "No contact yet"}</span>
              </span>
              <span className="text-xs text-muted">{p.tier} · {formatHealth(Number(p.balance))}</span>
            </button>
          </li>
        ))}
      </ul>
      {folder ? (
        <div className="grid gap-3 border-t border-border pt-4 text-sm">
          <h2 className="text-2xl">{folder.member}</h2>
          <p className="text-muted">{folder.email} · {folder.phone || "no phone"} · {folder.tier || "no plan"}</p>
          <p>Quota left {folder.quota ?? "none"}% {folder.expires ? `· plan ends ${when(folder.expires)}` : ""}</p>
          <p>Wallet {money(folder.balance)} · account {folder.account_number}</p>
          <p>Bank {folder.bank_name || "not set"} · {folder.bank_account_name || ""} · {folder.bank_account || ""}</p>
          <p>{[folder.gender, folder.dob, folder.nationality, folder.state, folder.address].filter(Boolean).join(" · ") || "Profile still thin"}</p>
          <p>Blood {folder.blood_group || "unknown"} · genotype {folder.genotype || "unknown"}</p>
          <p>Next of kin {folder.kin || "not set"} {folder.kin_phone || ""}</p>
          <h3 className="pt-2 font-semibold">Codes</h3>
          {(folder.codes || []).length === 0 ? <p className="text-muted">No codes.</p> : null}
          {(folder.codes || []).map((c) => (
            <p key={c.code}>{c.code} · {c.remaining}/{c.allocated}% · {c.status}</p>
          ))}
          <h3 className="pt-2 font-semibold">Visits</h3>
          {(folder.visits || []).length === 0 ? <p className="text-muted">No visits.</p> : null}
          {(folder.visits || []).map((v, i) => (
            <p key={`${v.when}-${i}`}>{v.kind} · {when(v.when)} · {v.minutes} min · {v.status} · {v.notes || ""}</p>
          ))}
          <h3 className="pt-2 font-semibold">Recent wallet</h3>
          {(folder.tx || []).map((t, i) => (
            <p key={`${t.at}-${i}`} className="text-muted">{when(t.at)} · {t.kind} · {t.amount} · {t.note}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RolesPane({ superAdmin }: { superAdmin: boolean }) {
  const { toast } = useToast();
  const [data, setData] = useState<RolesPayload | null>(null);
  const [name, setName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<number | "">("");

  async function load() {
    try {
      setData(await rpc<RolesPayload>("sh_admin_roles"));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not load roles");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRole(e: FormEvent) {
    e.preventDefault();
    try {
      await rpc("sh_admin_create_role", { p_name: name });
      setName("");
      toast("Role created");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create the role");
    }
  }

  async function toggle(roleId: number, perm: string, on: boolean) {
    try {
      await rpc("sh_admin_set_permission", { p_role_id: roleId, p_permission: perm, p_on: on });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not change that");
    }
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (inviteRole === "") return;
    try {
      await rpc("sh_admin_invite", { p_email: inviteEmail, p_role_id: inviteRole });
      setInviteEmail("");
      toast("Invite saved. They sign in at /admin with their own password, then set up 2FA.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not invite");
    }
  }

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-3xl">Roles</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Create a role, tick what it may touch, then invite a hospital email. If they already have a member account, the role attaches now. If not, it attaches the first time they sign in. Every staff member still sets up their own authenticator.
        </p>
      </div>
      {!data ? <HeartbeatLoader label="Loading roles" /> : null}
      {(data?.roles || []).map((role) => (
        <div key={role.id} className="grid gap-2 border-b border-border pb-4">
          <h2 className="text-lg font-semibold">{role.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ADMIN_PERMISSIONS.map((perm) => {
              const on = role.permissions.includes(perm.id);
              return (
                <label key={perm.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => void toggle(role.id, perm.id, e.target.checked)}
                  />
                  {perm.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <form className="flex flex-wrap gap-2" onSubmit={createRole}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New role name" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
        <button type="submit" className="text-sm font-semibold text-primary">Create role</button>
      </form>
      <form className="grid max-w-md gap-2" onSubmit={invite}>
        <p className="text-sm font-semibold">Invite staff</p>
        <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-border bg-bg px-3 py-2 text-sm" />
        <select
          required
          value={inviteRole}
          onChange={(e) => setInviteRole(Number(e.target.value))}
          className="rounded-xl border border-border bg-bg px-3 py-2 text-sm"
        >
          <option value="">Role</option>
          {(data?.roles || []).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-press w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-fg">
          Invite
        </button>
      </form>
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold">People holding a role</h2>
        {(data?.staff || []).length === 0 ? <p className="text-sm text-muted">No one assigned yet.</p> : null}
        {(data?.staff || []).map((s) => (
          <div key={s.user_id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm">
            <span>{s.name} · {s.email} · {s.role_name} · {s.active ? "active" : "paused"}</span>
            <span className="flex gap-3">
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => void rpc("sh_admin_set_staff", { p_user_id: s.user_id, p_active: !s.active }).then(load).catch((err) => toast(err.message))}
              >
                {s.active ? "Pause" : "Restore"}
              </button>
              {superAdmin ? (
                <button
                  type="button"
                  className="font-semibold text-primary"
                  onClick={() => void rpc("sh_admin_reset_totp", { p_user_id: s.user_id }).then(() => toast("Authenticator reset")).catch((err) => toast(err.message))}
                >
                  Reset 2FA
                </button>
              ) : null}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-1 text-sm">
        <h2 className="text-lg font-semibold">Invites</h2>
        {(data?.invites || []).map((i) => (
          <p key={i.id} className="text-muted">{i.email} · {i.role_name} · {i.accepted ? "accepted" : "waiting"} · {when(i.created_at)}</p>
        ))}
      </div>
    </section>
  );
}

function LogoPane() {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    rpc<{ logo_url: string | null }>("sh_public_brand")
      .then((d) => setUrl(d?.logo_url || null))
      .catch(() => undefined);
  }, []);

  async function upload(file: File) {
    const supabase = createClient();
    if (!supabase) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `logo/mark-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      toast(error.message);
      return;
    }
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    try {
      await rpc("sh_admin_set_logo", { p_url: data.publicUrl });
      setUrl(data.publicUrl);
      toast("Logo saved. It shows on the public header.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save the logo");
    }
  }

  return (
    <section className="grid max-w-md gap-4">
      <div>
        <h1 className="text-3xl">Logo</h1>
        <p className="mt-2 text-sm text-muted">
          This mark replaces the SH circle on the public site. Use a square PNG or SVG with a clear background.
        </p>
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Current hospital logo" className="size-16 rounded-full object-cover" />
      ) : (
        <p className="text-sm text-muted">No logo yet. The site still shows the SH mark.</p>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 2_000_000) {
            toast("Keep the file under 2 MB");
            return;
          }
          void upload(file);
        }}
      />
      {url ? (
        <button
          type="button"
          className="w-fit text-sm font-semibold text-primary"
          onClick={() => void rpc("sh_admin_set_logo", { p_url: "" }).then(() => { setUrl(null); toast("Logo cleared"); }).catch((err) => toast(err.message))}
        >
          Remove logo
        </button>
      ) : null}
    </section>
  );
}

function AuditPane() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    rpc<AuditRow[]>("sh_admin_audit_list")
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((err) => toast(err.message))
      .finally(() => setBusy(false));
  }, [toast]);

  return (
    <section className="grid gap-3">
      <h1 className="text-3xl">Audit</h1>
      <p className="text-sm text-muted">Who touched the desk, and what they did.</p>
      {busy ? <HeartbeatLoader label="Reading the log" /> : null}
      <ul>
        {rows.map((row, i) => (
          <li key={`${row.created_at}-${i}`} className="grid gap-0.5 border-b border-border py-3 text-sm">
            <span className="text-xs text-muted">{when(row.created_at)} · {row.actor_username}</span>
            <span className="font-semibold">{row.action}</span>
            <span className="text-muted">{row.details}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
