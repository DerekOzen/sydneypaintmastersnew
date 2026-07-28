// Cloudflare Pages Function.
//
// Makes  <this-site>/admin/*  serve the Nifty Websites dashboard (a separate
// Cloudflare Worker) without a subdomain. Everything else on the site is the
// normal static website. When this site later moves to the real custom domain,
// this same proxy makes it yourdomain.com/admin automatically.
//
// The visitor's real host is passed as X-Forwarded-Host so the dashboard knows
// which client's branding to show, and so Next Server Actions pass their
// same-origin (CSRF) check.

const DASHBOARD = "https://nifty-websites-dashboard.web-528.workers.dev";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = DASHBOARD + url.pathname + url.search;

  const headers = new Headers(request.headers);
  // Custom header name so Cloudflare doesn't overwrite it (it mangles the
  // standard X-Forwarded-Host on Worker subrequests). The dashboard reads this
  // to pick the client's branding.
  headers.set("X-Nifty-Host", url.host);
  headers.set("X-Forwarded-Host", url.host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));
  headers.delete("host"); // let fetch set Host to the dashboard Worker's own host

  const init = {
    method: request.method,
    headers,
    // redirect:"manual" so the browser (not this proxy) receives the dashboard's
    // 3xx redirects and follows them on this same origin via their relative paths.
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return fetch(target, init);
}
