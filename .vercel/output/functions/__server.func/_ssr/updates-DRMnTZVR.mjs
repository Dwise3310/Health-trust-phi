import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as PublicShell } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { m as listUpdates } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/updates-DRMnTZVR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Updates() {
	const [items, setItems] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		listUpdates().then(setItems).catch(() => setItems([]));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl",
				children: "Hospital updates"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "News, educative notes, and case stories."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid gap-4",
				children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No posts yet."
				}) : items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "grid gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-wide text-muted",
							children: p.kind
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl",
							children: p.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: p.excerpt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed",
							children: p.body
						})
					]
				}, p.id))
			})
		]
	}) });
}
//#endregion
export { Updates as component };
