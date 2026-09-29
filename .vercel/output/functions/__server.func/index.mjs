globalThis.__nitro_main__ = import.meta.url;
import { i as toEventHandler, n as HTTPError, o as NodeResponse, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Minimal emergency restore - full SSR will be restored next
// This keeps static assets + SPA shell working without Grok extensions

const htmlShell = (title = "Health Trust") => `<!DOCTYPE html><html lang="en" class="antialiased"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title><meta name="description" content="Health Trust by FarmGreat West Africa LLC with Eastern Ryse Specialist Hospital."/><meta name="theme-color" content="#1B5C48"/><link rel="stylesheet" href="/assets/styles-5FAnaXzH.css"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Outfit:wght@400;500;600&display=swap"/><script type="module" src="/assets/index-ht-v5.js"></script></head><body></body></html>`;

function getStaticPath(pathname) {
  const base = join(process.cwd(), ".vercel/output/static");
  let p = pathname === "/" ? "/index.html" : pathname;
  // rewrite old login/client names
  if (p === "/assets/login-BPZCp6gH.js") p = "/assets/login-ht-v5.js";
  if (p === "/assets/client-bLCk0icn.js") p = "/assets/client-ht-v4.js";
  return join(base, p.replace(/^\//, ""));
}

const MIME = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

export default {
  async fetch(req, context) {
    try {
      const url = new URL(req.url);
      const path = url.pathname;

      // Never inject Grok extensions — Health Trust is independent
      if (path.startsWith("/__grok")) {
        return new Response("Not found", { status: 404 });
      }

      // Static assets
      if (path.startsWith("/assets/") || path === "/og.jpg" || path === "/favicon.ico") {
        const file = getStaticPath(path);
        if (existsSync(file)) {
          const data = readFileSync(file);
          const ext = path.slice(path.lastIndexOf("."));
          return new Response(data, {
            headers: {
              "content-type": MIME[ext] || "application/octet-stream",
              "cache-control": "no-cache, no-store, must-revalidate, max-age=0",
            },
          });
        }
        return new Response("Not found", { status: 404 });
      }

      // Auth API — proxy note: full auth requires original server; return clear error
      if (path.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "API temporarily limited during deploy. Retry shortly." }), {
          status: 503,
          headers: { "content-type": "application/json", "cache-control": "no-store" },
        });
      }

      // SPA shell for all pages
      return new Response(htmlShell(), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache, no-store, must-revalidate, max-age=0",
        },
      });
    } catch (e) {
      return new Response("Server error: " + (e && e.message ? e.message : String(e)), { status: 500 });
    }
  },
};
