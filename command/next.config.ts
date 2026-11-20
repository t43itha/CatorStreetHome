import type { NextConfig } from "next";

// Content-Security-Policy (plan §8.5): the browser may only talk to this site, the Convex deployment
// and Microsoft sign-in. Next.js needs inline scripts and styles for hydration; dev also needs eval.
function csp(): string {
  const convex = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
  const convexWs = convex.replace(/^http/, "ws");
  const microsoft = "https://login.microsoftonline.com";
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://cdn.sheetjs.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${convex} ${convexWs} ${microsoft}`,
    `frame-src ${microsoft}`, // MSAL silent token renewal
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${microsoft}`,
    "object-src 'none'",
  ].join("; ");
}

const config: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Content-Security-Policy", value: csp() },
    ] }];
  },
};

export default config;
