import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as PublicShell } from "./router-BIiGf5TL.mjs";
import { i as TIERS, r as REFERRAL_PERCENT } from "./constants-SIRCXCh0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/referrals-B2eK_xCh.js
var import_jsx_runtime = require_jsx_runtime();
function Referrals() {
	const ids = Object.keys(TIERS);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-4xl px-4 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl",
				children: "Referral earnings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "The percentage you earn depends on your tier and the tier your referral joins. Prime referring Prime is the ceiling at 15% of what they pay."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[32rem] border-collapse text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-left text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 pr-4",
							children: "Referrer \\ Referred"
						}), ids.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 pr-4",
							children: TIERS[id].short
						}, id))]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ids.map((from) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 pr-4 font-medium",
							children: TIERS[from].short
						}), ids.map((to) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-3 pr-4 tabular-nums",
							children: [REFERRAL_PERCENT[from][to], "%"]
						}, to))]
					}, from)) })]
				})
			})
		]
	}) });
}
//#endregion
export { Referrals as component };
