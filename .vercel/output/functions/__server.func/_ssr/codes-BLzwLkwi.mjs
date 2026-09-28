import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { c as generateCareCode, d as listMyCodes, r as cancelCareCode } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/codes-BLzwLkwi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CodesPage() {
	const [codes, setCodes] = (0, import_react.useState)([]);
	const [percent, setPercent] = (0, import_react.useState)(20);
	const [msg, setMsg] = (0, import_react.useState)(null);
	async function load() {
		setCodes(await listMyCodes());
	}
	(0, import_react.useEffect)(() => {
		load().catch(() => void 0);
	}, []);
	async function create() {
		setMsg(null);
		try {
			const res = await generateCareCode({ data: { percent } });
			setMsg(`Code ${res.code} created. Share it with reception.`);
			await load();
		} catch (e) {
			setMsg(e instanceof Error ? e.message : "Failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl",
				children: "Care Quota codes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "pct",
						children: "Allocate remaining cover (%)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "pct",
						type: "number",
						min: 1,
						max: 100,
						value: percent,
						onChange: (e) => setPercent(Number(e.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: create,
						children: "Generate code"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: msg
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: codes.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium tracking-wide",
						children: c.code
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							c.remaining_percent,
							"% remaining of ",
							c.allocated_percent,
							"% · ",
							c.status
						]
					})] }), c.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: async () => {
							await cancelCareCode({ data: { id: c.id } });
							await load();
						},
						children: "Cancel"
					}) : null]
				}, c.id))
			})
		]
	});
}
//#endregion
export { CodesPage as component };
