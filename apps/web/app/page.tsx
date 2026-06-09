import { Navbar } from "@/components/navbar";
import { TunnelControl } from "@/components/tunnel-control";
import { getState } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getState();

  return (
    <main className="flex min-h-[100dvh] flex-col px-4 pb-10">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <TunnelControl initial={initial} />
      </div>
    </main>
  );
}
