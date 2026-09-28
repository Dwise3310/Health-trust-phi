import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as formatHealth, l as formatNaira, n as PublicShell, r as Button, u as nairaFromHealth } from "./router-BIiGf5TL.mjs";
import { i as TIERS } from "./constants-SIRCXCh0.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tiers-B5TFph_g.js
var import_jsx_runtime = require_jsx_runtime();
function Tiers() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-4 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl",
				children: "Membership tiers"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-muted",
				children: "You can upgrade while a plan is live. Remaining time is added to the new term. You cannot downgrade until the current plan expires."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4 md:grid-cols-3",
				children: Object.values(TIERS).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: t.short
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 text-2xl",
							children: t.name
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-2xl tabular-nums",
							children: formatHealth(t.priceHealth)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [formatNaira(nairaFromHealth(t.priceHealth)), " at 1 Health = ₦100"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "grid gap-2 text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [t.durationMonths, " months of Care Quota"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Refreshes to 100% every 3 months" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [t.refreshes, " auto-renewals in term"] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Queue rank ", t.queue === 1 ? "first" : t.queue === 2 ? "second" : "third"] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/login",
								children: ["Join ", t.short]
							})
						})
					]
				}, t.id))
			})
		]
	}) });
}
//#endregion
export { Tiers as component };
