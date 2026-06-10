import { Navbar } from "@/components/navbar";
import { TunnelControl } from "@/components/tunnel-control";
import { getState } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getState();

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-y-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(45rem 30rem at 8% 0%, color-mix(in oklab, var(--muted) 72%, transparent), transparent 68%), radial-gradient(40rem 30rem at 100% 100%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />
      <Navbar />
      <div className="relative z-0 flex-1 px-4 pt-3 pb-4 md:pt-4">
        <TunnelControl initial={initial} />
      </div>
    </main>
  );
}
