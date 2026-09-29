import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as authClient } from "./client-1vAx-gM_.mjs";
import { n as PublicShell, r as Button } from "./router-BIiGf5TL.mjs";
import { t as Card } from "./card-DPVf0SYh.mjs";
import { n as Label, t as Input } from "./label-BHmTOCCo.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [info, setInfo] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [remember, setRemember] = (0, import_react.useState)(true);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	function onSocial(provider) {
		setError(provider === "google" ? "Google sign-in is not connected yet. Use email for now." : "X sign-in is not connected yet. Use email for now.");
		setInfo(null);
	}
	async function onEmail(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		setInfo(null);
		try {
			if (mode === "forgot") {
				const res = await authClient.forgetPassword({ email, redirectTo: `${window.location.origin}/login` });
				if (res.error) throw new Error(res.error.message || "Could not send reset email");
				setInfo("If that email exists, a reset link was sent. Check your inbox.");
				return;
			}
			if (mode === "up") {
				const res = await authClient.signUp.email({ email, password, name });
				if (res.error) throw new Error(res.error.message);
				setInfo("Account created.");
				setMode("in");
				return;
			}
			const res = await authClient.signIn.email({ email, password, rememberMe: remember });
			if (res.error) throw new Error(res.error.message);
			window.location.assign("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not complete request");
		} finally {
			setBusy(false);
		}
	}
	const title = mode === "forgot" ? "Reset password" : mode === "up" ? "Create your account" : "Sign in to Health Trust";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto grid max-w-md gap-6 px-4 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-muted", children: "Member access" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "mt-1 text-3xl", children: title })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "grid gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					(mode === "in" || mode === "up") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", variant: "outline", className: "w-full opacity-80", onClick: () => onSocial("google"), children: "Continue with Google" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", variant: "outline", className: "w-full opacity-80", onClick: () => onSocial("x"), children: "Continue with X" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-3 text-xs text-muted", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }), "or email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })] })
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "grid gap-3",
						onSubmit: onEmail,
						children: [
							mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid gap-1.5", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { htmlFor: "name", children: "Full name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { id: "name", value: name, onChange: (e) => setName(e.target.value), required: true })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid gap-1.5", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { htmlFor: "email", children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }),
						mode !== "forgot" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid gap-1.5", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { htmlFor: "password", children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), minLength: 8, required: true, className: "pr-11" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-fg px-2", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? "Hide" : "Show" })] })] }) : null,
						mode === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between gap-3", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "flex cursor-pointer items-center gap-2 text-sm text-muted", children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked), className: "size-4 rounded border-border" }), "Remember me"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "text-sm text-primary hover:underline", onClick: () => { setMode("forgot"); setError(null); setInfo(null); }, children: "Forgot password?" })] }) : null,
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-danger", children: error }) : null,
						info ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-sm text-muted", children: info }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "submit", disabled: busy, children: busy ? "Please wait…" : mode === "up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in" })
					]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "text-sm text-muted hover:text-fg", onClick: () => { setMode(mode === "up" || mode === "forgot" ? "in" : "up"); setError(null); setInfo(null); }, children: mode === "up" ? "Already a member? Sign in" : mode === "forgot" ? "Back to sign in" : "New here? Create an account" })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { to: "/", className: "text-center text-sm text-muted", children: "Back home" })
		]
	}) });
}
export { Login as component };
