import { TunnelControl } from "@/components/tunnel-control";
import { getState } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await getState();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-6">
      <TunnelControl initial={initial} />
    </main>
  );
}
