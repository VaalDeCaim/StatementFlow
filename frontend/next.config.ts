import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(__dirname);

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    // In dev, relax CSP so Next.js dev overlay, React DevTools,
    // and other tooling can inject the inline scripts/styles they need.
    // In production, keep a strict baseline CSP.
    value: isProd
      ? "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
      : [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          // Allow dev tooling & Next.js overlay inline scripts/styles in development only.
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'inline-speculation-rules'",
          "style-src 'self' 'unsafe-inline'",
        ].join("; ") + ";",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // Only bundle components you use from HeroUI (faster dev compiles)
    optimizePackageImports: ["@heroui/react"],
  },
  async headers() {
    const list = [{ source: "/:path*", headers: securityHeaders }];
    if (isProd) {
      list.push({
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      });
    }
    return list;
  },
  // Only set webpack context so module resolution uses this project's root
  // (avoids resolving from parent dirs). Do not override resolve.modules
  // so Next.js internal subpath resolution keeps working.
  webpack(config) {
    config.context = projectRoot;
    return config;
  },
};

export default nextConfig;
