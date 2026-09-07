import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: no `output: "standalone"` — that is self-hosting/container config.
  // Vercel uses its own output pipeline; standalone broke the old `cp`-based build script.
  // Ensure the SQLite database file is traced into serverless function bundles.
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
