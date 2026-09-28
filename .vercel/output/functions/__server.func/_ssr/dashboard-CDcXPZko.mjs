import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, h as Outlet, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as UserButton, i as RedirectToSignIn, o as useCurrentUserState, r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { g as setUsername, o as ensureMember } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-CDcXPZko.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var nav = [
	{
		to: "/dashboard",
		label: "Overview",
		exact: true
	},
	{
		to: "/dashboard/wallet",
		label: "Wallet"
	},
	{
		to: "/dashboard/codes",
		label: "Care Quota codes"
	},
	{
		to: "/dashboard/cards",
		label: "Appointment cards"
	},
	{
		to: "/dashboard/appointments",
		label: "Bookings"
	},
	{
		to: "/dashboard/referrals",
		label: "Referrals"
	},
	{
		to: "/dashboard/check",
		label: "Check a code"
	}
];
function DashboardLayout() {
	const { user, isPending } = useCurrentUserState();
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [loadErr, setLoadErr] = (0, import_react.useState)(null);
	async function reload() {
		const data = await ensureMember();
		setSnap(data);
	}
	(0, import_react.useEffect)(() => {
		if (!user) return;
		ensureMember().then(setSnap).catch((e) => setLoadErr(e instanceof Error ? e.message : "Failed"));
	}, [user]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-bg text-muted",
		children: "Loading session…"
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	if (!snap) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-bg text-muted",
		children: loadErr ?? "Preparing your membership…"
	});
	if (!snap.profile.username) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UsernameGate, { onDone: reload });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between border-b border-border px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "font-display text-lg",
				children: "Health Trust"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hidden text-sm text-muted sm:inline",
					children: ["@", snap.profile.username]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex gap-2 overflow-x-auto md:flex-col md:overflow-visible",
				children: nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: item.to,
					className: "whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted hover:bg-surface hover:text-fg",
					activeProps: { className: "bg-surface text-fg" },
					activeOptions: item.exact ? { exact: true } : void 0,
					children: item.label
				}, item.to))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})]
		})]
	});
}
function UsernameGate({ onDone }) {
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onSubmit(e) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		setBusy(true);
		setError(null);
		try {
			await setUsername({ data: {
				username: String(fd.get("username") ?? ""),
				fullName: String(fd.get("fullName") ?? "") || void 0,
				phone: String(fd.get("phone") ?? "") || void 0,
				referredBy: String(fd.get("referredBy") ?? "") || void 0
			} });
			await onDone();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid min-h-screen place-items-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "grid w-full max-w-md gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl",
					children: "Choose a permanent username"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Usernames are unique and cannot be changed later. Use this as your public handle and referral identity."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "grid gap-3",
					onSubmit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "username",
								children: "Username"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "username",
								name: "username",
								required: true,
								minLength: 3
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "fullName",
								children: "Full name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "fullName",
								name: "fullName"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "phone",
								children: "Phone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "phone",
								name: "phone"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "referredBy",
								children: "Referrer username or code (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "referredBy",
								name: "referredBy"
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-danger",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy,
							children: "Lock username"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { DashboardLayout as component };
