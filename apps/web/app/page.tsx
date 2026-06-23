import { Navbar } from "@/components/navbar";
import { TunnelControl } from "@/components/tunnel-control";
import { getState } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getState();

  return (
    <main
      id="main-content"
      className="relative flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-muted/20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 50% -20%, color-mix(in oklab, var(--primary) 6%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-0 mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-4 pb-6">
        <Navbar />
        <div className="flex-1 pt-4">
          <TunnelControl initial={initial} />
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-status-region />
    </main>
  );
}
