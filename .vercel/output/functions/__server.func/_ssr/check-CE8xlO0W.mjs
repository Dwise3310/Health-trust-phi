import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { i as checkCode } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/check-CE8xlO0W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CheckPage() {
	const [code, setCode] = (0, import_react.useState)("");
	const [result, setResult] = (0, import_react.useState)(void 0);
	const [looked, setLooked] = (0, import_react.useState)(false);
	async function run() {
		const row = await checkCode({ data: { code } });
		setResult(row);
		setLooked(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Check a code"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "code",
						children: "Care Quota code"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "code",
						value: code,
						onChange: (e) => setCode(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: run,
						children: "Search"
					})
				]
			}),
			looked && !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "No code found."
			}) : null,
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium tracking-wide",
						children: result.code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Created ",
							new Date(result.created_at).toLocaleString(),
							" UTC"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							"Spendable: ",
							result.remaining_percent,
							"% of ",
							result.allocated_percent,
							"%"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							"Creator: @",
							result.username ?? "unknown",
							" · ",
							result.tier ?? "no live tier"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: ["Status: ", result.status]
					})
				]
			}) : null
		]
	});
}
//#endregion
export { CheckPage as component };
