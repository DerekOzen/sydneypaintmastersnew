// Retire the Cloudflare preview URL for SEO/AEO/GEO: once a site is live on its real
// domain, permanently redirect every hit on the *.pages.dev preview host to the same
// path on the real domain. This consolidates all ranking/citation signals onto one
// branded domain and removes the duplicate.
//
// SAFE BY DESIGN: the real domain is read from /nifty-site.json, which the dashboard
// only writes when a custom domain has been connected. If that file is absent (or has no
// primaryHost), nothing is redirected — so a site still on its .pages.dev preview during
// build/testing is never taken offline.
export async function onRequest(context) {
  const { request, next, env } = context;
  let url;
  try { url = new URL(request.url); } catch (e) { return next(); }
  if (!url.hostname.endsWith(".pages.dev")) return next();
  try {
    const res = await env.ASSETS.fetch(new URL("/nifty-site.json", url.origin));
    if (res && res.ok) {
      const cfg = await res.json();
      const primary = String((cfg && cfg.primaryHost) || "").trim().toLowerCase();
      if (primary && primary !== url.hostname) {
        return Response.redirect("https://" + primary + url.pathname + url.search, 301);
      }
    }
  } catch (e) { /* no config yet → serve the preview normally */ }
  return next();
}
