import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  CARD_PRICE_HEALTH,
  CALL_PRICES,
  PHYSICAL_PRICES,
  REFERRAL_PERCENT,
  TIERS,
  type TierId,
} from "./constants";

function randDigits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "HT-";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function addMonths(iso: Date, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d;
}

type ProfileRow = {
  user_id: string;
  username: string | null;
  username_locked: boolean;
  full_name: string | null;
  phone: string | null;
  role: string;
  referral_code: string;
  referred_by: string | null;
};

type WalletRow = {
  user_id: string;
  health_balance: string;
  account_number: string;
};

type SubRow = {
  id: number;
  user_id: string;
  tier: TierId;
  started_at: string;
  expires_at: string;
  quota_percent: string;
  next_refresh_at: string;
  active: boolean;
};

async function refreshIfNeeded(sql: Awaited<ReturnType<typeof getSql>>, sub: SubRow) {
  const now = new Date();
  const expires = new Date(sub.expires_at);
  if (now > expires) {
    await sql`update subscriptions set active = false where id = ${sub.id} and user_id = ${sub.user_id}`;
    return { ...sub, active: false };
  }
  let next = new Date(sub.next_refresh_at);
  let quota = Number(sub.quota_percent);
  let changed = false;
  while (now >= next && next < expires) {
    quota = 100;
    next = addMonths(next, 3);
    changed = true;
  }
  if (changed) {
    await sql`update subscriptions set quota_percent = ${quota}, next_refresh_at = ${next.toISOString()} where id = ${sub.id} and user_id = ${sub.user_id}`;
    return { ...sub, quota_percent: String(quota), next_refresh_at: next.toISOString() };
  }
  return sub;
}

export const ensureMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    if (existing[0]) {
      const wallet = await sql<WalletRow>`select * from wallets where user_id = ${context.userId}`;
      const subs = await sql<SubRow>`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
      const sub = subs[0] ? await refreshIfNeeded(sql, subs[0]) : null;
      return { profile: existing[0], wallet: wallet[0] ?? null, subscription: sub };
    }
    const referral_code = `HT${randDigits(8)}`;
    const account_number = `88${randDigits(8)}`;
    await sql`insert into profiles (user_id, referral_code, role) values (${context.userId}, ${referral_code}, 'member')`;
    await sql`insert into wallets (user_id, health_balance, account_number) values (${context.userId}, 0, ${account_number})`;
    const profile = (await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`)[0];
    const wallet = (await sql<WalletRow>`select * from wallets where user_id = ${context.userId}`)[0];
    return { profile, wallet, subscription: null };
  });

export const setUsername = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { username: string; fullName?: string; phone?: string; referredBy?: string }) =>
    z
      .object({
        username: z
          .string()
          .min(3)
          .max(24)
          .regex(/^[a-zA-Z0-9_]+$/),
        fullName: z.string().max(80).optional(),
        phone: z.string().max(20).optional(),
        referredBy: z.string().max(24).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    const me = rows[0];
    if (!me) throw new Error("Profile missing");
    if (me.username_locked) throw new Error("Username is permanent and cannot be changed");
    const taken = await sql<{ n: number }>`select count(*)::int as n from profiles where lower(username) = ${data.username.toLowerCase()}`;
    if (taken[0]?.n) throw new Error("Username already taken");
    let referred_by = me.referred_by;
    if (data.referredBy) {
      const ref = await sql<ProfileRow>`select * from profiles where lower(username) = ${data.referredBy.toLowerCase()} or referral_code = ${data.referredBy}`;
      if (ref[0] && ref[0].user_id !== context.userId) referred_by = ref[0].user_id;
    }
    await sql`update profiles set username = ${data.username}, username_locked = true, full_name = ${data.fullName ?? null}, phone = ${data.phone ?? null}, referred_by = ${referred_by} where user_id = ${context.userId}`;
    return { ok: true };
  });

export const fundWalletDemo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { amount: number }) => z.object({ amount: z.number().min(10).max(5000) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update wallets set health_balance = health_balance + ${data.amount} where user_id = ${context.userId}`;
    await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${data.amount}, 'fund', 'Wallet funding')`;
    return { ok: true };
  });

export const subscribeTier = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { tier: TierId }) => z.object({ tier: z.enum(["base", "plus", "prime"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const tier = TIERS[data.tier];
    const wallets = await sql<WalletRow>`select * from wallets where user_id = ${context.userId}`;
    const wallet = wallets[0];
    if (!wallet) throw new Error("Wallet missing");
    const balance = Number(wallet.health_balance);
    const active = await sql<SubRow>`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
    let remainingMonths = 0;
    if (active[0]) {
      const current = TIERS[active[0].tier];
      if (tier.queue >= current.queue) {
        throw new Error("You can only upgrade to a higher tier while a plan is active");
      }
      const leftMs = new Date(active[0].expires_at).getTime() - Date.now();
      remainingMonths = Math.max(0, leftMs / (1000 * 60 * 60 * 24 * 30));
      await sql`update subscriptions set active = false where id = ${active[0].id} and user_id = ${context.userId}`;
    }
    if (balance < tier.priceHealth) throw new Error("Not enough Health in wallet");
    await sql`update wallets set health_balance = health_balance - ${tier.priceHealth} where user_id = ${context.userId}`;
    await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-tier.priceHealth}, 'subscribe', ${tier.name})`;
    const start = new Date();
    const extraDays = remainingMonths * 30;
    const expires = addMonths(start, tier.durationMonths);
    expires.setDate(expires.getDate() + extraDays);
    const nextRefresh = addMonths(start, 3);
    await sql`insert into subscriptions (user_id, tier, started_at, expires_at, quota_percent, next_refresh_at, active) values (${context.userId}, ${data.tier}, ${start.toISOString()}, ${expires.toISOString()}, 100, ${nextRefresh.toISOString()}, true)`;

    const me = (await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`)[0];
    if (me?.referred_by) {
      const referrerSub = await sql<SubRow>`select * from subscriptions where user_id = ${me.referred_by} and active = true order by id desc limit 1`;
      if (referrerSub[0]) {
        const pct = REFERRAL_PERCENT[referrerSub[0].tier][data.tier];
        const bonus = (tier.priceHealth * pct) / 100;
        await sql`update wallets set health_balance = health_balance + ${bonus} where user_id = ${me.referred_by}`;
        await sql`insert into wallet_tx (user_id, amount, kind, note) values (${me.referred_by}, ${bonus}, 'referral', ${`Referral bonus ${pct}%`})`;
        const exists = await sql<{ n: number }>`select count(*)::int as n from referrals where referred_id = ${context.userId}`;
        if (!exists[0]?.n) {
          await sql`insert into referrals (referrer_id, referred_id, percent) values (${me.referred_by}, ${context.userId}, ${pct})`;
        }
      }
    }
    return { ok: true };
  });

export const generateCareCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { percent: number }) => z.object({ percent: z.number().min(1).max(100) }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const subs = await sql<SubRow>`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
    if (!subs[0]) throw new Error("No active Care Quota");
    const sub = await refreshIfNeeded(sql, subs[0]);
    const available = Number(sub.quota_percent);
    if (available <= 0) throw new Error("No Care Quota remaining");
    if (data.percent > available) throw new Error("Not enough remaining quota");
    const code = makeCode();
    await sql`insert into care_codes (user_id, code, allocated_percent, remaining_percent, status) values (${context.userId}, ${code}, ${data.percent}, ${data.percent}, 'active')`;
    return { code };
  });

export const listMyCodes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      code: string;
      allocated_percent: string;
      remaining_percent: string;
      status: string;
      created_at: string;
    }>`select id, code, allocated_percent, remaining_percent, status, created_at from care_codes where user_id = ${context.userId} order by id desc`;
  });

export const cancelCareCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update care_codes set status = 'cancelled' where id = ${data.id} and user_id = ${context.userId} and status = 'active'`;
    return { ok: true };
  });

export const checkCode = createServerFn({ method: "POST" })
  .validator((d: { code: string }) => z.object({ code: z.string().min(4) }).parse(d))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      code: string;
      remaining_percent: string;
      allocated_percent: string;
      status: string;
      created_at: string;
      username: string | null;
      tier: string | null;
    }>`
      select c.code, c.remaining_percent, c.allocated_percent, c.status, c.created_at, p.username, s.tier
      from care_codes c
      join profiles p on p.user_id = c.user_id
      left join subscriptions s on s.user_id = c.user_id and s.active = true
      where c.code = ${data.code.trim().toUpperCase()}
      limit 1
    `;
    return rows[0] ?? null;
  });

export const debitCode = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { code: string; percent: number }) =>
    z.object({ code: z.string(), percent: z.number().min(0.1).max(100) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const staff = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    if (!staff[0] || (staff[0].role !== "super_admin" && staff[0].role !== "staff")) {
      throw new Error("Staff access required");
    }
    const codes = await sql<{
      id: number;
      user_id: string;
      remaining_percent: string;
      status: string;
    }>`select id, user_id, remaining_percent, status from care_codes where code = ${data.code.trim().toUpperCase()}`;
    const code = codes[0];
    if (!code || code.status !== "active") throw new Error("Code is not active");
    const remaining = Number(code.remaining_percent);
    if (data.percent > remaining) throw new Error("Exceeds remaining code cover");
    const next = remaining - data.percent;
    await sql`update care_codes set remaining_percent = ${next}, status = ${next <= 0 ? "exhausted" : "active"} where id = ${code.id}`;
    const subs = await sql<SubRow>`select * from subscriptions where user_id = ${code.user_id} and active = true order by id desc limit 1`;
    if (subs[0]) {
      const q = Math.max(0, Number(subs[0].quota_percent) - data.percent);
      await sql`update subscriptions set quota_percent = ${q} where id = ${subs[0].id}`;
    }
    await sql`insert into audit_log (actor_username, action, details) values (${staff[0].username ?? staff[0].user_id}, 'debit_code', ${`${data.code} - ${data.percent}%`})`;
    return { remaining: next };
  });

export const listTx = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      amount: string;
      kind: string;
      note: string | null;
      created_at: string;
    }>`select id, amount, kind, note, created_at from wallet_tx where user_id = ${context.userId} order by id desc limit 40`;
  });

export const buyCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { cardType: "normal" | "vip" }) =>
    z.object({ cardType: z.enum(["normal", "vip"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const wallets = await sql<WalletRow>`select * from wallets where user_id = ${context.userId}`;
    if (!wallets[0] || Number(wallets[0].health_balance) < CARD_PRICE_HEALTH) {
      throw new Error("Not enough Health");
    }
    await sql`update wallets set health_balance = health_balance - ${CARD_PRICE_HEALTH} where user_id = ${context.userId}`;
    await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-CARD_PRICE_HEALTH}, 'card', ${data.cardType + " appointment card"})`;
    await sql`insert into appointment_cards (user_id, card_type, health_cost) values (${context.userId}, ${data.cardType}, ${CARD_PRICE_HEALTH})`;
    return { ok: true };
  });

export const listCards = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      card_type: string;
      status: string;
      created_at: string;
    }>`select id, card_type, status, created_at from appointment_cards where user_id = ${context.userId} order by id desc`;
  });

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { kind: "physical" | "audio"; minutes: number; when: string; notes?: string }) =>
    z
      .object({
        kind: z.enum(["physical", "audio"]),
        minutes: z.number(),
        when: z.string(),
        notes: z.string().max(400).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const table = data.kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;
    const price = table.find((p) => p.minutes === data.minutes);
    if (!price) throw new Error("Invalid duration");
    const sql = await getSql();
    const wallets = await sql<WalletRow>`select * from wallets where user_id = ${context.userId}`;
    if (!wallets[0] || Number(wallets[0].health_balance) < price.health) {
      throw new Error("Not enough Health");
    }
    await sql`update wallets set health_balance = health_balance - ${price.health} where user_id = ${context.userId}`;
    await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-price.health}, ${data.kind}, ${`${data.kind} ${data.minutes} min`})`;
    await sql`insert into appointments (user_id, kind, duration_min, scheduled_at, health_cost, notes) values (${context.userId}, ${data.kind}, ${data.minutes}, ${data.when}, ${price.health}, ${data.notes ?? null})`;
    return { ok: true };
  });

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: number;
      kind: string;
      duration_min: number;
      scheduled_at: string;
      health_cost: string;
      status: string;
    }>`select id, kind, duration_min, scheduled_at, health_cost, status from appointments where user_id = ${context.userId} order by scheduled_at desc`;
  });

export const listReferrals = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      percent: string;
      created_at: string;
      username: string | null;
    }>`select r.percent, r.created_at, p.username from referrals r left join profiles p on p.user_id = r.referred_id where r.referrer_id = ${context.userId} order by r.id desc`;
  });

export const sendEnquiry = createServerFn({ method: "POST" })
  .validator((d: { name: string; email: string; message: string }) =>
    z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
        message: z.string().min(8).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`insert into enquiries (name, email, message) values (${data.name}, ${data.email}, ${data.message})`;
    return { ok: true };
  });

export const listUpdates = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    kind: string;
    published_at: string;
  }>`select id, title, slug, excerpt, body, kind, published_at from hospital_updates order by published_at desc`;
});

export const listAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = (await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`)[0];
    if (!me || me.role !== "super_admin") throw new Error("Super admin only");
    return sql<{
      id: number;
      actor_username: string;
      action: string;
      details: string;
      created_at: string;
    }>`select id, actor_username, action, details, created_at from audit_log order by id desc limit 80`;
  });
