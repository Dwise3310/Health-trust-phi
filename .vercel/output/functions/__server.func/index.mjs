/**
 * Health Trust — Vercel serverless entry (no Grok / xAI)
 * Delegates all traffic to the TanStack Start SSR renderer.
 */
import { a as toRequest, n as HTTPError } from "./_libs/h3+rou3+srvx.mjs";

function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) return mod.fetch(req);
      if (!promise) promise = loader().then((_mod) => (mod = _mod.default || _mod));
      return promise.then((m) => m.fetch(req));
    },
  };
}

const viteServices = {
  ssr: lazyService(() => import("./_ssr/ssr.mjs").then((n) => n.c)),
};

function fetchViteEnv(viteEnvName, input, init) {
  const viteEnv = viteServices[viteEnvName];
  if (!viteEnv) throw HTTPError.status(404);
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}

function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}

export default {
  async fetch(req, context) {
    try {
      req.runtime ??= { name: "vercel" };
      req.runtime.vercel = { context };
      let ip;
      Object.defineProperty(req, "ip", {
        get() {
          const h = req.headers.get("x-forwarded-for");
          return (ip ??= h?.split(",").shift()?.trim());
        },
      });
      if (context?.waitUntil) req.waitUntil = context.waitUntil;
      return await ssrRenderer({ req });
    } catch (err) {
      console.error("[health-trust] server error", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
