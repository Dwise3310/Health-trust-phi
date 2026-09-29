/** Health Trust auth stub — Grok OAuth removed. Email auth reconnected in next pass. */
const auth = {
  api: {
    getSession: async () => null,
    signInEmail: async () => { throw new Error("Auth temporarily rebuilding — try again shortly"); },
    signUpEmail: async () => { throw new Error("Auth temporarily rebuilding — try again shortly"); },
  },
  handler: async () => new Response(JSON.stringify({ error: "auth rebuilding" }), { status: 503 }),
};
const authConfigured = false;
const GROK_PROVIDERS = [];
const hasGateSessionMarker = () => false;
const gateIdentityEnabled = false;
export const a = hasGateSessionMarker;
export const i = gateIdentityEnabled;
export const n = auth;
export const r = authConfigured;
export const t = GROK_PROVIDERS;
export default { a, i, n, r, t, auth, authConfigured, GROK_PROVIDERS, hasGateSessionMarker, gateIdentityEnabled };
