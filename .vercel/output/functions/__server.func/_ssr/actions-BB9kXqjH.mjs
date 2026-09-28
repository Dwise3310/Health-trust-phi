import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { D as _enum, F as object, P as number, R as string } from "../_libs/@better-auth/core+[...].mjs";
import { r as getSql } from "./db-QIdgVsC2.mjs";
import { t as authMiddleware } from "./middleware-B4MpUGzV.mjs";
import { i as TIERS, n as PHYSICAL_PRICES, r as REFERRAL_PERCENT, t as CALL_PRICES } from "./constants-SIRCXCh0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-BB9kXqjH.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function randDigits(n) {
	let s = "";
	for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
	return s;
}
function makeCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let s = "HT-";
	for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * 32)];
	return s;
}
function addMonths(iso, months) {
	const d = new Date(iso);
	d.setMonth(d.getMonth() + months);
	return d;
}
async function refreshIfNeeded(sql, sub) {
	const now = /* @__PURE__ */ new Date();
	const expires = new Date(sub.expires_at);
	if (now > expires) {
		await sql`update subscriptions set active = false where id = ${sub.id} and user_id = ${sub.user_id}`;
		return {
			...sub,
			active: false
		};
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
		return {
			...sub,
			quota_percent: String(quota),
			next_refresh_at: next.toISOString()
		};
	}
	return sub;
}
var ensureMember_createServerFn_handler = createServerRpc({
	id: "6492d5219af7fe062e126946310a29ceb18ee664605fbb55200f32ba1eb4b514",
	name: "ensureMember",
	filename: "src/lib/health/actions.ts"
}, (opts) => ensureMember.__executeServer(opts));
var ensureMember = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(ensureMember_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const existing = await sql`select * from profiles where user_id = ${context.userId}`;
	if (existing[0]) {
		const wallet = await sql`select * from wallets where user_id = ${context.userId}`;
		const subs = await sql`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
		const sub = subs[0] ? await refreshIfNeeded(sql, subs[0]) : null;
		return {
			profile: existing[0],
			wallet: wallet[0] ?? null,
			subscription: sub
		};
	}
	const referral_code = `HT${randDigits(8)}`;
	const account_number = `88${randDigits(8)}`;
	await sql`insert into profiles (user_id, referral_code, role) values (${context.userId}, ${referral_code}, 'member')`;
	await sql`insert into wallets (user_id, health_balance, account_number) values (${context.userId}, 0, ${account_number})`;
	return {
		profile: (await sql`select * from profiles where user_id = ${context.userId}`)[0],
		wallet: (await sql`select * from wallets where user_id = ${context.userId}`)[0],
		subscription: null
	};
});
var setUsername_createServerFn_handler = createServerRpc({
	id: "d46d956e738d9df2364d6d716c19b56d9356cdf5449495b072790ab7037285e9",
	name: "setUsername",
	filename: "src/lib/health/actions.ts"
}, (opts) => setUsername.__executeServer(opts));
var setUsername = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	username: string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
	fullName: string().max(80).optional(),
	phone: string().max(20).optional(),
	referredBy: string().max(24).optional()
}).parse(d)).handler(setUsername_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const me = (await sql`select * from profiles where user_id = ${context.userId}`)[0];
	if (!me) throw new Error("Profile missing");
	if (me.username_locked) throw new Error("Username is permanent and cannot be changed");
	if ((await sql`select count(*)::int as n from profiles where lower(username) = ${data.username.toLowerCase()}`)[0]?.n) throw new Error("Username already taken");
	let referred_by = me.referred_by;
	if (data.referredBy) {
		const ref = await sql`select * from profiles where lower(username) = ${data.referredBy.toLowerCase()} or referral_code = ${data.referredBy}`;
		if (ref[0] && ref[0].user_id !== context.userId) referred_by = ref[0].user_id;
	}
	await sql`update profiles set username = ${data.username}, username_locked = true, full_name = ${data.fullName ?? null}, phone = ${data.phone ?? null}, referred_by = ${referred_by} where user_id = ${context.userId}`;
	return { ok: true };
});
var fundWalletDemo_createServerFn_handler = createServerRpc({
	id: "da9fa1231c0ef0bad55b308baf0512e4bf99c722e5561804c95b7cb1f0fb9600",
	name: "fundWalletDemo",
	filename: "src/lib/health/actions.ts"
}, (opts) => fundWalletDemo.__executeServer(opts));
var fundWalletDemo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ amount: number().min(10).max(5e3) }).parse(d)).handler(fundWalletDemo_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await sql`update wallets set health_balance = health_balance + ${data.amount} where user_id = ${context.userId}`;
	await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${data.amount}, 'fund', 'Wallet funding')`;
	return { ok: true };
});
var subscribeTier_createServerFn_handler = createServerRpc({
	id: "b126fa3631affa6e5d6c15b3d1fff6b575bbab74bc5a12ab3b51da07725c9c25",
	name: "subscribeTier",
	filename: "src/lib/health/actions.ts"
}, (opts) => subscribeTier.__executeServer(opts));
var subscribeTier = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ tier: _enum([
	"base",
	"plus",
	"prime"
]) }).parse(d)).handler(subscribeTier_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const tier = TIERS[data.tier];
	const wallet = (await sql`select * from wallets where user_id = ${context.userId}`)[0];
	if (!wallet) throw new Error("Wallet missing");
	const balance = Number(wallet.health_balance);
	const active = await sql`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
	let remainingMonths = 0;
	if (active[0]) {
		const current = TIERS[active[0].tier];
		if (tier.queue >= current.queue) throw new Error("You can only upgrade to a higher tier while a plan is active");
		const leftMs = new Date(active[0].expires_at).getTime() - Date.now();
		remainingMonths = Math.max(0, leftMs / 2592e6);
		await sql`update subscriptions set active = false where id = ${active[0].id} and user_id = ${context.userId}`;
	}
	if (balance < tier.priceHealth) throw new Error("Not enough Health in wallet");
	await sql`update wallets set health_balance = health_balance - ${tier.priceHealth} where user_id = ${context.userId}`;
	await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-tier.priceHealth}, 'subscribe', ${tier.name})`;
	const start = /* @__PURE__ */ new Date();
	const extraDays = remainingMonths * 30;
	const expires = addMonths(start, tier.durationMonths);
	expires.setDate(expires.getDate() + extraDays);
	const nextRefresh = addMonths(start, 3);
	await sql`insert into subscriptions (user_id, tier, started_at, expires_at, quota_percent, next_refresh_at, active) values (${context.userId}, ${data.tier}, ${start.toISOString()}, ${expires.toISOString()}, 100, ${nextRefresh.toISOString()}, true)`;
	const me = (await sql`select * from profiles where user_id = ${context.userId}`)[0];
	if (me?.referred_by) {
		const referrerSub = await sql`select * from subscriptions where user_id = ${me.referred_by} and active = true order by id desc limit 1`;
		if (referrerSub[0]) {
			const pct = REFERRAL_PERCENT[referrerSub[0].tier][data.tier];
			const bonus = tier.priceHealth * pct / 100;
			await sql`update wallets set health_balance = health_balance + ${bonus} where user_id = ${me.referred_by}`;
			await sql`insert into wallet_tx (user_id, amount, kind, note) values (${me.referred_by}, ${bonus}, 'referral', ${`Referral bonus ${pct}%`})`;
			if (!(await sql`select count(*)::int as n from referrals where referred_id = ${context.userId}`)[0]?.n) await sql`insert into referrals (referrer_id, referred_id, percent) values (${me.referred_by}, ${context.userId}, ${pct})`;
		}
	}
	return { ok: true };
});
var generateCareCode_createServerFn_handler = createServerRpc({
	id: "1762bbe9a58ca1b86be82f11f7d678ce956c0fd30fd581dd2d02bee103ebba5a",
	name: "generateCareCode",
	filename: "src/lib/health/actions.ts"
}, (opts) => generateCareCode.__executeServer(opts));
var generateCareCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ percent: number().min(1).max(100) }).parse(d)).handler(generateCareCode_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const subs = await sql`select * from subscriptions where user_id = ${context.userId} and active = true order by id desc limit 1`;
	if (!subs[0]) throw new Error("No active Care Quota");
	const sub = await refreshIfNeeded(sql, subs[0]);
	const available = Number(sub.quota_percent);
	if (available <= 0) throw new Error("No Care Quota remaining");
	if (data.percent > available) throw new Error("Not enough remaining quota");
	const code = makeCode();
	await sql`insert into care_codes (user_id, code, allocated_percent, remaining_percent, status) values (${context.userId}, ${code}, ${data.percent}, ${data.percent}, 'active')`;
	return { code };
});
var listMyCodes_createServerFn_handler = createServerRpc({
	id: "535c01a1400eda1e3a874b669f301691ab62739eaaed85cc9b3a90d4423b034a",
	name: "listMyCodes",
	filename: "src/lib/health/actions.ts"
}, (opts) => listMyCodes.__executeServer(opts));
var listMyCodes = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyCodes_createServerFn_handler, async ({ context }) => {
	return (await getSql())`select id, code, allocated_percent, remaining_percent, status, created_at from care_codes where user_id = ${context.userId} order by id desc`;
});
var cancelCareCode_createServerFn_handler = createServerRpc({
	id: "fb89a8d6273ca685953d37d5e5cc87f42141311a50aa10fd9d8a833e6318e0ef",
	name: "cancelCareCode",
	filename: "src/lib/health/actions.ts"
}, (opts) => cancelCareCode.__executeServer(opts));
var cancelCareCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ id: number() }).parse(d)).handler(cancelCareCode_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`update care_codes set status = 'cancelled' where id = ${data.id} and user_id = ${context.userId} and status = 'active'`;
	return { ok: true };
});
var checkCode_createServerFn_handler = createServerRpc({
	id: "ed06310b55da17da21413832acda2035e98e5326b1ea7d37e83f696ae49c8cc0",
	name: "checkCode",
	filename: "src/lib/health/actions.ts"
}, (opts) => checkCode.__executeServer(opts));
var checkCode = createServerFn({ method: "POST" }).validator((d) => object({ code: string().min(4) }).parse(d)).handler(checkCode_createServerFn_handler, async ({ data }) => {
	return (await (await getSql())`
      select c.code, c.remaining_percent, c.allocated_percent, c.status, c.created_at, p.username, s.tier
      from care_codes c
      join profiles p on p.user_id = c.user_id
      left join subscriptions s on s.user_id = c.user_id and s.active = true
      where c.code = ${data.code.trim().toUpperCase()}
      limit 1
    `)[0] ?? null;
});
var debitCode_createServerFn_handler = createServerRpc({
	id: "56383b4bda24a4d087a1418c83ce6f9f3812cfd030eb26e2761421fec2f82234",
	name: "debitCode",
	filename: "src/lib/health/actions.ts"
}, (opts) => debitCode.__executeServer(opts));
var debitCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	code: string(),
	percent: number().min(.1).max(100)
}).parse(d)).handler(debitCode_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const staff = await sql`select * from profiles where user_id = ${context.userId}`;
	if (!staff[0] || staff[0].role !== "super_admin" && staff[0].role !== "staff") throw new Error("Staff access required");
	const code = (await sql`select id, user_id, remaining_percent, status from care_codes where code = ${data.code.trim().toUpperCase()}`)[0];
	if (!code || code.status !== "active") throw new Error("Code is not active");
	const remaining = Number(code.remaining_percent);
	if (data.percent > remaining) throw new Error("Exceeds remaining code cover");
	const next = remaining - data.percent;
	await sql`update care_codes set remaining_percent = ${next}, status = ${next <= 0 ? "exhausted" : "active"} where id = ${code.id}`;
	const subs = await sql`select * from subscriptions where user_id = ${code.user_id} and active = true order by id desc limit 1`;
	if (subs[0]) await sql`update subscriptions set quota_percent = ${Math.max(0, Number(subs[0].quota_percent) - data.percent)} where id = ${subs[0].id}`;
	await sql`insert into audit_log (actor_username, action, details) values (${staff[0].username ?? staff[0].user_id}, 'debit_code', ${`${data.code} - ${data.percent}%`})`;
	return { remaining: next };
});
var listTx_createServerFn_handler = createServerRpc({
	id: "88d7d0ebf61ca3f1b2f754b87a0d12fe70a3149c1b9aed5520498cc17df81ec8",
	name: "listTx",
	filename: "src/lib/health/actions.ts"
}, (opts) => listTx.__executeServer(opts));
var listTx = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listTx_createServerFn_handler, async ({ context }) => {
	return (await getSql())`select id, amount, kind, note, created_at from wallet_tx where user_id = ${context.userId} order by id desc limit 40`;
});
var buyCard_createServerFn_handler = createServerRpc({
	id: "7e02fc3dbb7e247c663c63cfbdb2828c163e099d93f66464b3142f30b4e97181",
	name: "buyCard",
	filename: "src/lib/health/actions.ts"
}, (opts) => buyCard.__executeServer(opts));
var buyCard = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({ cardType: _enum(["normal", "vip"]) }).parse(d)).handler(buyCard_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const wallets = await sql`select * from wallets where user_id = ${context.userId}`;
	if (!wallets[0] || Number(wallets[0].health_balance) < 50) throw new Error("Not enough Health");
	await sql`update wallets set health_balance = health_balance - ${50} where user_id = ${context.userId}`;
	await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-50}, 'card', ${data.cardType + " appointment card"})`;
	await sql`insert into appointment_cards (user_id, card_type, health_cost) values (${context.userId}, ${data.cardType}, ${50})`;
	return { ok: true };
});
var listCards_createServerFn_handler = createServerRpc({
	id: "851d1de9594eb18cce30e9f8ab18706018b75282287ffc73222e15e9ccf21889",
	name: "listCards",
	filename: "src/lib/health/actions.ts"
}, (opts) => listCards.__executeServer(opts));
var listCards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCards_createServerFn_handler, async ({ context }) => {
	return (await getSql())`select id, card_type, status, created_at from appointment_cards where user_id = ${context.userId} order by id desc`;
});
var bookAppointment_createServerFn_handler = createServerRpc({
	id: "2d466ddeb6366e23a7cdf396954ca55a00bec80d1b58d42081f85fb63d67feda",
	name: "bookAppointment",
	filename: "src/lib/health/actions.ts"
}, (opts) => bookAppointment.__executeServer(opts));
var bookAppointment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => object({
	kind: _enum(["physical", "audio"]),
	minutes: number(),
	when: string(),
	notes: string().max(400).optional()
}).parse(d)).handler(bookAppointment_createServerFn_handler, async ({ context, data }) => {
	const price = (data.kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES).find((p) => p.minutes === data.minutes);
	if (!price) throw new Error("Invalid duration");
	const sql = await getSql();
	const wallets = await sql`select * from wallets where user_id = ${context.userId}`;
	if (!wallets[0] || Number(wallets[0].health_balance) < price.health) throw new Error("Not enough Health");
	await sql`update wallets set health_balance = health_balance - ${price.health} where user_id = ${context.userId}`;
	await sql`insert into wallet_tx (user_id, amount, kind, note) values (${context.userId}, ${-price.health}, ${data.kind}, ${`${data.kind} ${data.minutes} min`})`;
	await sql`insert into appointments (user_id, kind, duration_min, scheduled_at, health_cost, notes) values (${context.userId}, ${data.kind}, ${data.minutes}, ${data.when}, ${price.health}, ${data.notes ?? null})`;
	return { ok: true };
});
var listAppointments_createServerFn_handler = createServerRpc({
	id: "a93cecdd362c0fce82906298034f5649e4be68e80d742a5215c336ea0b826fbc",
	name: "listAppointments",
	filename: "src/lib/health/actions.ts"
}, (opts) => listAppointments.__executeServer(opts));
var listAppointments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAppointments_createServerFn_handler, async ({ context }) => {
	return (await getSql())`select id, kind, duration_min, scheduled_at, health_cost, status from appointments where user_id = ${context.userId} order by scheduled_at desc`;
});
var listReferrals_createServerFn_handler = createServerRpc({
	id: "94e2710eb8e19203e6a19ba7286be9f784cbc8c7d7b123e84d941eae2977a082",
	name: "listReferrals",
	filename: "src/lib/health/actions.ts"
}, (opts) => listReferrals.__executeServer(opts));
var listReferrals = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listReferrals_createServerFn_handler, async ({ context }) => {
	return (await getSql())`select r.percent, r.created_at, p.username from referrals r left join profiles p on p.user_id = r.referred_id where r.referrer_id = ${context.userId} order by r.id desc`;
});
var sendEnquiry_createServerFn_handler = createServerRpc({
	id: "e25fb69c52598a11ba47c17d77bff4b2dfacc323258d25d899f2bef78b233894",
	name: "sendEnquiry",
	filename: "src/lib/health/actions.ts"
}, (opts) => sendEnquiry.__executeServer(opts));
var sendEnquiry = createServerFn({ method: "POST" }).validator((d) => object({
	name: string().min(2).max(80),
	email: string().email(),
	message: string().min(8).max(1e3)
}).parse(d)).handler(sendEnquiry_createServerFn_handler, async ({ data }) => {
	await (await getSql())`insert into enquiries (name, email, message) values (${data.name}, ${data.email}, ${data.message})`;
	return { ok: true };
});
var listUpdates_createServerFn_handler = createServerRpc({
	id: "ce0f1bcb542ad03b9c71baa35154bc1b442ed26eae10d845499a289bd7b272d2",
	name: "listUpdates",
	filename: "src/lib/health/actions.ts"
}, (opts) => listUpdates.__executeServer(opts));
var listUpdates = createServerFn({ method: "GET" }).handler(listUpdates_createServerFn_handler, async () => {
	return (await getSql())`select id, title, slug, excerpt, body, kind, published_at from hospital_updates order by published_at desc`;
});
var listAudit_createServerFn_handler = createServerRpc({
	id: "55b0341b8f1ee3801102a782679719a833c61bb8222d79c4de4233bd453ae872",
	name: "listAudit",
	filename: "src/lib/health/actions.ts"
}, (opts) => listAudit.__executeServer(opts));
var listAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listAudit_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const me = (await sql`select * from profiles where user_id = ${context.userId}`)[0];
	if (!me || me.role !== "super_admin") throw new Error("Super admin only");
	return sql`select id, actor_username, action, details, created_at from audit_log order by id desc limit 80`;
});
//#endregion
export { bookAppointment_createServerFn_handler, buyCard_createServerFn_handler, cancelCareCode_createServerFn_handler, checkCode_createServerFn_handler, debitCode_createServerFn_handler, ensureMember_createServerFn_handler, fundWalletDemo_createServerFn_handler, generateCareCode_createServerFn_handler, listAppointments_createServerFn_handler, listAudit_createServerFn_handler, listCards_createServerFn_handler, listMyCodes_createServerFn_handler, listReferrals_createServerFn_handler, listTx_createServerFn_handler, listUpdates_createServerFn_handler, sendEnquiry_createServerFn_handler, setUsername_createServerFn_handler, subscribeTier_createServerFn_handler };
