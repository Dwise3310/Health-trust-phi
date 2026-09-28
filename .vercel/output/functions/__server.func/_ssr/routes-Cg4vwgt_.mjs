import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Shield, n as Users, o as HeartPulse, s as ArrowRight } from "../_libs/lucide-react.mjs";
import { c as formatHealth, l as formatNaira, n as PublicShell, r as Button, u as nairaFromHealth } from "./router-BIiGf5TL.mjs";
import { i as TIERS } from "./constants-SIRCXCh0.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cg4vwgt_.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-6xl px-4 py-16 md:py-24",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium tracking-wide text-primary",
					children: "FarmGreat West Africa LLC · Eastern Ryse Specialist Hospital"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 max-w-3xl text-4xl leading-tight md:text-6xl",
					children: "Health is not a luxury. Care should reach you before the bill does."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-2xl text-lg text-muted",
					children: "Register and you become a Health Trust VIP patient. Consultation and diagnosis sit inside your Care Quota. Referrals pay you back. The aim is simple: healthier, wealthier lives."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/tiers",
							children: ["Become a member ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						variant: "outline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/how-it-works",
							children: "See how Care Quota works"
						})
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "border-y border-border bg-surface",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3",
				children: [
					{
						icon: HeartPulse,
						title: "Care Quota",
						body: "A percentage cover the consultant confirms on site. It refreshes every three months for the life of your plan."
					},
					{
						icon: Shield,
						title: "Priority by tier",
						body: "Prime is seen first, then Plus, then Base. Shared codes carry the generator’s queue standing."
					},
					{
						icon: Users,
						title: "Share cover",
						body: "Issue a code from your dashboard so a friend or family member can walk into Eastern Ryse with your cover."
					}
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-6 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl",
							children: item.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed text-muted",
							children: item.body
						})
					]
				}, item.title))
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-6xl px-4 py-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-3xl",
					children: "Three ways in"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/tiers",
					className: "text-sm text-primary",
					children: "Compare tiers"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-4 md:grid-cols-3",
				children: Object.values(TIERS).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: t.short
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-2xl",
							children: t.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium tabular-nums",
							children: [formatHealth(t.priceHealth), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-sm font-normal text-muted",
								children: formatNaira(nairaFromHealth(t.priceHealth))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								t.durationMonths,
								" months of Care Quota · refreshes every 3 months (",
								t.refreshes,
								" auto-renewals)"
							]
						})
					]
				}, t.id))
			})]
		})
	] }) });
}
//#endregion
export { Home as component };
