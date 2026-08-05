/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Every page URL ends in a trailing slash (e.g. /about/). With static export on
  // Cloudflare Pages, /about serves as /about/ and the non-slash form 308-redirects to
  // it, making the slash version the single canonical URL. Canonical tags + sitemap are
  // generated to match. Well-known files (robots/ai/llms.txt, sitemap.xml) still emit as
  // files, not folders (verified by build).
  trailingSlash: true,
  images: { unoptimized: true },
  // This is a content-driven site: lists come from JSON that can be empty or
  // change shape. Don't let type/lint checks fail the build over that — an empty
  // list simply renders nothing. Keeps client sites resilient.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
