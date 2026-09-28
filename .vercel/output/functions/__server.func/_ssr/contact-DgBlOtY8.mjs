import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as PublicShell, r as Button, s as cn } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
import { h as sendEnquiry } from "./actions-CjO9TbL0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contact-DgBlOtY8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Contact() {
	const [sent, setSent] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onSubmit(e) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		setError(null);
		try {
			await sendEnquiry({ data: {
				name: String(fd.get("name") ?? ""),
				email: String(fd.get("email") ?? ""),
				message: String(fd.get("message") ?? "")
			} });
			setSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not send");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto grid max-w-4xl gap-8 px-4 py-16 md:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-4xl",
			children: "Enquire"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-muted",
			children: "Eastern Ryse Specialist Hospital, Nigeria. Write to us about membership, visits, or partnership."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Received. We will reply by email." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "grid gap-3",
			onSubmit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "name",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "name",
						name: "name",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "email",
						children: "Email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "email",
						name: "email",
						type: "email",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "message",
						children: "Message"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "message",
						name: "message",
						required: true
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-danger",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: "Send enquiry"
				})
			]
		}) })]
	}) });
}
//#endregion
export { Contact as component };
