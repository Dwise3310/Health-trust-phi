import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { f as listReferrals, o as ensureMember } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/referrals-DSP0Zv4j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReferralsPage() {
	const [code, setCode] = (0, import_react.useState)("");
	const [rows, setRows] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		ensureMember().then((s) => setCode(s.profile.referral_code)).catch(() => void 0);
		listReferrals().then(setRows).catch(() => void 0);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Referrals"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Your referral code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-2xl tracking-wide",
					children: code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "New members enter your username or this code when they lock their handle."
				})
			] }),
			rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"@",
				r.username ?? "member",
				" · ",
				r.percent,
				"%"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: new Date(r.created_at).toLocaleString()
			})] }, i))
		]
	});
}
//#endregion
export { ReferralsPage as component };
