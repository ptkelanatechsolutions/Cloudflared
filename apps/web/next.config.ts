import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Trace from the monorepo root so the standalone bundle includes the
  // workspace package (@cloudflared/core) and its dependencies.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@cloudflared/core"],
  // No next/image is used. Disabling optimization guarantees the bundled
  // `sharp` binary (built for the build platform) is never loaded at runtime,
  // so the standalone built once on amd64 runs safely on arm64/arm too.
  images: { unoptimized: true },
};

export default nextConfig;
