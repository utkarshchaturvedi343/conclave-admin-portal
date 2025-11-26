import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;


// // next.config.ts
// import type { NextConfig } from "next";

// const isProd = process.env.NODE_ENV === "production";

// /**
//  * Content-Security-Policy:
//  * - 'self' limits to same-origin for most things
//  * - 'unsafe-inline' for styles is allowed here because many apps rely on inline styles from frameworks.
//  *   Remove 'unsafe-inline' if you can serve styles from files only.
//  * - Add any third-party domains you use (analytics, CDN, APIs) to the relevant directives.
//  */
// const contentSecurityPolicy = `
//   default-src 'self';
//   script-src 'self' 'unsafe-inline' https:;
//   style-src 'self' 'unsafe-inline' https:;
//   img-src 'self' data: https:;
//   connect-src 'self' https:;
//   font-src 'self' https: data:;
//   frame-ancestors 'none';
//   base-uri 'self';
// `.replace(/\n/g, " ").trim();

// const nextConfig: NextConfig = {
//   async headers() {
//     // Apply security headers to all routes
//     // In development you might want fewer restrictions; we keep Cache-Control always, but HSTS only in prod.
//     const commonHeaders = [
//       // Prevent content sniffing
//       { key: "X-Content-Type-Options", value: "nosniff" },

//       // Clickjacking protection
//       { key: "X-Frame-Options", value: "DENY" },

//       // Prevent referrer leakage
//       { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },

//       // Permissions policy — limit powerful features (modify per app needs)
//       // Example: disable camera/microphone/geolocation, allow fullscreen
//       {
//         key: "Permissions-Policy",
//         value:
//           "camera=(), microphone=(), geolocation=(), accelerated-compositing=(), fullscreen=(self)",
//       },

//       // Cache-control to prevent sensitive pages from being stored
//       { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },

//       // Content Security Policy (CSP)
//       { key: "Content-Security-Policy", value: contentSecurityPolicy },
//     ];

//     const prodOnlyHeaders = [
//       // HSTS - only safe to set when site served on HTTPS in production
//       {
//         key: "Strict-Transport-Security",
//         value: "max-age=31536000; includeSubDomains; preload",
//       },
//       // Optional: Expect-CT or other reporting headers could go here
//     ];

//     const headers = [
//       {
//         source: "/:path*", // apply to all routes
//         headers: isProd ? [...commonHeaders, ...prodOnlyHeaders] : commonHeaders,
//       },
//     ];

//     return headers;
//   },
// };

// export default nextConfig;



// // next.config.ts
// import type { NextConfig } from "next";

// const isProd = process.env.NODE_ENV === "production";

// /**
//  * NOTE about CSP:
//  * - This CSP is a sensible starting point. It uses 'self' and https: wildcards.
//  * - It allows 'unsafe-inline' for styles because many apps (or some libs) use inline styles.
//  *   For scripts we avoid 'unsafe-inline' by default. If you need inline scripts, consider
//  *   switching to nonce/hash approach or temporarily add 'unsafe-inline' for script-src.
//  * - Adjust connect-src, img-src, font-src to include any third-party domains you use.
//  *
//  * If you're unsure, first deploy the CSP as "Report-Only" by using the
//  * Content-Security-Policy-Report-Only header (see comment below) to collect violations.
//  */
// const contentSecurityPolicy = [
//   "default-src 'self'",
//   "script-src 'self' https: 'unsafe-eval'", // 'unsafe-eval' only if you rely on it (e.g. some devtools); remove if not needed
//   "style-src 'self' 'unsafe-inline' https:",
//   "img-src 'self' data: https:",
//   "connect-src 'self' https:",
//   "font-src 'self' https: data:",
//   "frame-ancestors 'none'",
//   "base-uri 'self'",
// ].join("; ");

// const nextConfig: NextConfig = {
//   async headers() {
//     const commonHeaders = [
//       // Prevent MIME sniffing
//       { key: "X-Content-Type-Options", value: "nosniff" },

//       // Clickjacking protection — DENY is safest. Switch to SAMEORIGIN if you embed same-origin frames.
//       { key: "X-Frame-Options", value: "DENY" },

//       // Control referrer information
//       { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },

//       // Permissions policy — disable powerful features unless needed
//       {
//         key: "Permissions-Policy",
//         value:
//           "camera=(), microphone=(), geolocation=(), interest-cohort=()", // interest-cohort disables FLoC
//       },

//       // Prevent caching of sensitive data in browsers
//       { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },

//       // Enforce CSP (adjust domains as per your third-party usage)
//       { key: "Content-Security-Policy", value: contentSecurityPolicy },

//       // Optional: set CSP report-only to test before enforcing.
//       // To test first, comment the above CSP line and uncomment the following:
//       // { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
//     ];

//     const prodOnlyHeaders = [
//       // HSTS — only on production HTTPS
//       {
//         key: "Strict-Transport-Security",
//         value: "max-age=31536000; includeSubDomains; preload",
//       },
//     ];

//     return [
//       {
//         source: "/:path*",
//         headers: isProd ? [...commonHeaders, ...prodOnlyHeaders] : commonHeaders,
//       },
//     ];
//   },
// };

// export default nextConfig;
