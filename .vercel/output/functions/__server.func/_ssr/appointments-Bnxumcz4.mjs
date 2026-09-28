import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as formatHealth, r as Button } from "./router-BIiGf5TL.mjs";
import { n as PHYSICAL_PRICES, t as CALL_PRICES } from "./constants-SIRCXCh0.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { l as listAppointments, t as bookAppointment } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/appointments-Bnxumcz4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppointmentsPage() {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [kind, setKind] = (0, import_react.useState)("audio");
	const [minutes, setMinutes] = (0, import_react.useState)(25);
	const [when, setWhen] = (0, import_react.useState)("");
	const [msg, setMsg] = (0, import_react.useState)(null);
	const prices = kind === "audio" ? CALL_PRICES : PHYSICAL_PRICES;
	async function load() {
		setRows(await listAppointments());
	}
	(0, import_react.useEffect)(() => {
		load().catch(() => void 0);
	}, []);
	async function book() {
		setMsg(null);
		try {
			await bookAppointment({ data: {
				kind,
				minutes,
				when: new Date(when).toISOString()
			} });
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
				children: "Bookings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Audio calls stay inside Health Trust. Physical visits are time-priced. Prime waiting area at the hospital for Prime members and Prime-issued codes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: kind === "audio" ? "default" : "outline",
							onClick: () => {
								setKind("audio");
								setMinutes(25);
							},
							children: "Audio call"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: kind === "physical" ? "default" : "outline",
							onClick: () => {
								setKind("physical");
								setMinutes(30);
							},
							children: "Physical visit"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Duration" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: prices.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							variant: minutes === p.minutes ? "default" : "outline",
							onClick: () => setMinutes(p.minutes),
							children: [
								p.minutes,
								" min · ",
								formatHealth(p.health)
							]
						}, p.minutes))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "when",
						children: "When"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "when",
						type: "datetime-local",
						value: when,
						onChange: (e) => setWhen(e.target.value)
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: msg
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: book,
						disabled: !when,
						children: "Confirm booking"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						r.kind,
						" · ",
						r.duration_min,
						" min"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						new Date(r.scheduled_at).toLocaleString(),
						" · ",
						formatHealth(Number(r.health_cost)),
						" · ",
						r.status
					]
				})] }, r.id))
			})
		]
	});
}
//#endregion
export { AppointmentsPage as component };
