import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as formatHealth, r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { o as ensureMember, p as listTx, s as fundWalletDemo } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallet-D6c6GjVN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WalletPage() {
	const [balance, setBalance] = (0, import_react.useState)(0);
	const [account, setAccount] = (0, import_react.useState)("");
	const [tx, setTx] = (0, import_react.useState)([]);
	const [msg, setMsg] = (0, import_react.useState)(null);
	async function load() {
		const snap = await ensureMember();
		setBalance(Number(snap.wallet?.health_balance ?? 0));
		setAccount(snap.wallet?.account_number ?? "");
		setTx(await listTx());
	}
	(0, import_react.useEffect)(() => {
		load().catch(() => void 0);
	}, []);
	async function fund(amount) {
		setMsg(null);
		try {
			await fundWalletDemo({ data: { amount } });
			await load();
			setMsg(`Added ${amount} Health. Bank funding will replace this once payments go live.`);
		} catch (e) {
			setMsg(e instanceof Error ? e.message : "Failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Wallet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Health balance"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-3xl tabular-nums",
					children: formatHealth(balance)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: ["Unique funding account: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-fg",
						children: account
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "1 Health = ₦100. USD shown later from the live rate."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => fund(250),
						children: "Add 250 Health"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => fund(1e3),
						children: "Add 1,000 Health"
					})]
				}),
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: msg
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl",
					children: "Activity"
				}), tx.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No movements yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-2 text-sm",
					children: tx.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between border-b border-border py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [row.kind, row.note ? ` · ${row.note}` : ""] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums",
							children: [Number(row.amount) > 0 ? "+" : "", row.amount]
						})]
					}, row.id))
				})]
			})
		]
	});
}
//#endregion
export { WalletPage as component };
