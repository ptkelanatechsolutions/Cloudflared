import { Navbar } from "@/components/navbar";

export default function Loading() {
  return (
    <main className="relative flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-muted/20">
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
          <div className="mx-auto flex h-full min-h-0 w-full flex-col">
            <div className="grid gap-4 xl:grid-cols-12">
              {/* Hero skeleton */}
              <section className="animate-pulse rounded-2xl border border-border/50 bg-card shadow-xs xl:col-span-7">
                <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2.5">
                      <div className="h-3.5 w-28 rounded-md bg-muted" />
                      <div className="h-9 w-40 rounded-md bg-muted" />
                    </div>
                    <div className="h-6 w-20 rounded-full bg-muted" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="h-14 rounded-xl bg-muted/50" />
                    <div className="h-14 rounded-xl bg-muted/50" />
                    <div className="h-14 rounded-xl bg-muted/50" />
                  </div>
                </div>
              </section>

              {/* Token skeleton */}
              <section className="animate-pulse rounded-2xl border border-border/50 bg-card shadow-xs xl:col-span-5">
                <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
                  <div className="h-10 w-36 rounded-md bg-muted" />
                  <div className="h-10 w-full rounded-xl bg-muted/50" />
                  <div className="mt-2 h-16 rounded-xl bg-muted/50" />
                </div>
              </section>

              {/* Settings skeleton */}
              <section className="animate-pulse rounded-2xl border border-border/50 bg-card shadow-xs xl:col-span-7">
                <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
                  <div className="h-3.5 w-28 rounded-md bg-muted" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="h-20 rounded-xl bg-muted/50" />
                    <div className="h-20 rounded-xl bg-muted/50" />
                  </div>
                </div>
              </section>

              {/* Observability skeleton */}
              <section className="animate-pulse rounded-2xl border border-border/50 bg-card shadow-xs xl:col-span-5">
                <div className="flex flex-col gap-4 px-5 pt-5 pb-5">
                  <div className="h-3.5 w-28 rounded-md bg-muted" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="h-20 rounded-xl bg-muted/50" />
                    <div className="h-20 rounded-xl bg-muted/50" />
                    <div className="h-20 rounded-xl bg-muted/50" />
                    <div className="h-20 rounded-xl bg-muted/50" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
