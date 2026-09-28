import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as RedirectToSignIn, o as useCurrentUserState, r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { a as debitCode, i as checkCode } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-RbOr2VXB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	const { user, isPending } = useCurrentUserState();
	const [code, setCode] = (0, import_react.useState)("");
	const [percent, setPercent] = (0, import_react.useState)(10);
	const [slip, setSlip] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)(null);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-bg",
		children: "Loading…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	async function verify() {
		setMsg(null);
		const row = await checkCode({ data: { code } });
		setSlip(row);
		if (!row) setMsg("Code not found");
	}
	async function debit() {
		setMsg(null);
		try {
			const res = await debitCode({ data: {
				code,
				percent
			} });
			setMsg(`Debited. Remaining ${res.remaining}%`);
			await verify();
		} catch (e) {
			setMsg(e instanceof Error ? e.message : "Failed");
		}
	}
	function printSlip() {
		window.print();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto grid max-w-xl gap-4 px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Reception"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Verify a Care Quota code, print a slip, then debit after the consultant confirms. Debit requires a staff or super admin role."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "code",
						children: "Code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "code",
						value: code,
						onChange: (e) => setCode(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: verify,
						children: "Verify"
					})
				]
			}),
			slip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				id: "slip",
				className: "grid gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-wide text-muted",
						children: "Eastern Ryse · Health Trust"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xl tracking-wide",
						children: slip.code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Spendable ",
						slip.remaining_percent,
						"%"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Creator @",
						slip.username,
						" · ",
						slip.tier
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: new Date(slip.created_at).toLocaleString()
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: printSlip,
							children: "Print slip"
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "pct",
						children: "Debit percent after consultant sign-off"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "pct",
						type: "number",
						value: percent,
						onChange: (e) => setPercent(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: debit,
						children: "Debit cover"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: msg
					}) : null
				]
			})
		]
	});
}
//#endregion
export { AdminPage as component };
