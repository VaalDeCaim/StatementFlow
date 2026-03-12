import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // Only bundle components you use from HeroUI (faster dev compiles)
    optimizePackageImports: ["@heroui/react"],
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
