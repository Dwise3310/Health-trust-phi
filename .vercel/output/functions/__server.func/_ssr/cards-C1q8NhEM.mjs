import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as formatHealth, r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as buyCard, u as listCards } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cards-C1q8NhEM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CardsPage() {
	const [cards, setCards] = (0, import_react.useState)([]);
	const [msg, setMsg] = (0, import_react.useState)(null);
	async function load() {
		setCards(await listCards());
	}
	(0, import_react.useEffect)(() => {
		load().catch(() => void 0);
	}, []);
	async function buy(cardType) {
		setMsg(null);
		try {
			await buyCard({ data: { cardType } });
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
				children: "Digital appointment cards"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Skip the physical queue for an access card. Skeleton price ",
					formatHealth(50),
					" each. VIP is for immediate consultation."
				]
			}),
			msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-danger",
				children: msg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Normal card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => buy("normal"),
						children: "Buy normal"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "VIP card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => buy("vip"),
						children: "Buy VIP"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: cards.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium uppercase",
					children: c.card_type
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						c.status,
						" · ",
						new Date(c.created_at).toLocaleString()
					]
				})] }, c.id))
			})
		]
	});
}
//#endregion
export { CardsPage as component };
