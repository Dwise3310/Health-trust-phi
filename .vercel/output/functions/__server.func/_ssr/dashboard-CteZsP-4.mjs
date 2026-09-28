import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as formatHealth, r as Button } from "./router-BIiGf5TL.mjs";
import { i as TIERS } from "./constants-SIRCXCh0.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { _ as subscribeTier, o as ensureMember } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-CteZsP-4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Overview() {
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)(null);
	async function load() {
		setSnap(await ensureMember());
	}
	(0, import_react.useEffect)(() => {
		load().catch(() => void 0);
	}, []);
	async function join(tier) {
		setMsg(null);
		try {
			await subscribeTier({ data: { tier } });
			await load();
			setMsg(`Joined ${TIERS[tier].name}`);
		} catch (e) {
			setMsg(e instanceof Error ? e.message : "Could not subscribe");
		}
	}
	if (!snap) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Loading…"
	});
	const sub = snap.subscription;
	const quota = sub ? Number(sub.quota_percent) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Overview"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Wallet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-2xl tabular-nums",
							children: formatHealth(Number(snap.wallet?.health_balance ?? 0))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: ["Account ", snap.wallet?.account_number]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Care Quota"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-2xl tabular-nums",
							children: [quota.toFixed(0), "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 h-2 overflow-hidden rounded-full bg-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-primary",
								style: { width: `${Math.min(100, quota)}%` }
							})
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Plan"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-2xl",
							children: sub ? TIERS[sub.tier].short : "None"
						}),
						sub ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: [
								"Next refresh ",
								new Date(sub.next_refresh_at).toLocaleDateString(),
								" · ends ",
								new Date(sub.expires_at).toLocaleDateString()
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "Subscribe from the wallet after funding."
						})
					] })
				]
			}),
			msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: msg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: Object.values(TIERS).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "grid gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: t.name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "tabular-nums",
							children: formatHealth(t.priceHealth)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: () => join(t.id),
							children: sub ? "Upgrade / join" : "Subscribe"
						})
					]
				}, t.id))
			})
		]
	});
}
//#endregion
export { Overview as component };
