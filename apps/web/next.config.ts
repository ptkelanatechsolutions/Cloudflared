import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Trace from the monorepo root so the standalone bundle includes the
  // workspace package (@cloudflared/core) and its dependencies.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@cloudflared/core"],
};

export default nextConfig;
