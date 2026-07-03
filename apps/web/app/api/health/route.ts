import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Dynamic import to avoid pulling server-only code into the edge runtime
  const { cloudflaredManager } = await import("@cloudflared/core");

  const s = cloudflaredManager.status();
  const ok = s.state === "running" || s.state === "stopped";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      tunnel: s.state,
      uptime: s.startedAt,
      pid: s.pid,
    },
    { status: ok ? 200 : 503 },
  );
}
