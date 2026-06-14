import { Navbar } from "@/components/navbar";

export default function Loading() {
  return (
    <main className="relative flex h-dvh flex-col overflow-y-auto">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(45rem 30rem at 8% 0%, color-mix(in oklab, var(--muted) 72%, transparent), transparent 68%), radial-gradient(40rem 30rem at 100% 100%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="relative z-0 mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-4">
        <Navbar />
        <div className="flex-1 pt-3 pb-4 md:pt-4">
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[88rem] flex-col">
            <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-12">
              {/* Hero skeleton */}
              <section className="min-h-0 animate-pulse rounded-[2rem] border border-border bg-muted/35 p-2 shadow-sm md:col-span-4 xl:col-span-12">
                <div className="h-full min-h-0 rounded-[1.65rem] border-0 bg-card ring-1 ring-border/70">
                  <div className="flex flex-col gap-5 px-6 pt-6 pb-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <div className="h-4 w-32 rounded-full bg-muted" />
                        <div className="h-12 w-48 rounded-lg bg-muted" />
                      </div>
                      <div className="h-6 w-20 rounded-full bg-muted" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="h-16 rounded-[1.4rem] bg-muted/50" />
                      <div className="h-16 rounded-[1.4rem] bg-muted/50" />
                      <div className="h-16 rounded-[1.4rem] bg-muted/50" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Token skeleton */}
              <section className="min-h-0 animate-pulse rounded-[2rem] border border-border bg-muted/35 p-2 shadow-sm md:col-span-4 xl:col-span-12">
                <div className="h-full min-h-0 rounded-[1.65rem] border-0 bg-card ring-1 ring-border/70">
                  <div className="flex flex-col gap-5 px-6 pt-5 pb-5">
                    <div className="h-8 w-40 rounded-full bg-muted" />
                    <div className="h-11 w-full rounded-[1.15rem] bg-muted/50" />
                  </div>
                </div>
              </section>

              {/* Settings skeleton */}
              <section className="min-h-0 animate-pulse rounded-[2rem] border border-border bg-muted/35 p-2 shadow-sm md:col-span-4 xl:col-span-12">
                <div className="h-full min-h-0 rounded-[1.65rem] border-0 bg-card ring-1 ring-border/70">
                  <div className="flex flex-col gap-5 px-6 pt-5 pb-5">
                    <div className="h-4 w-40 rounded-full bg-muted" />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="h-24 rounded-[1rem] bg-muted/50" />
                      <div className="h-24 rounded-[1rem] bg-muted/50" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Observability skeleton */}
              <section className="min-h-0 animate-pulse rounded-[2rem] border border-border bg-muted/35 p-2 shadow-sm md:col-span-4 xl:col-span-12">
                <div className="h-full min-h-0 rounded-[1.65rem] border-0 bg-card ring-1 ring-border/70">
                  <div className="flex flex-col gap-5 px-6 pt-5 pb-5">
                    <div className="h-4 w-40 rounded-full bg-muted" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="h-24 rounded-[1.45rem] bg-muted/50" />
                      <div className="h-24 rounded-[1.45rem] bg-muted/50" />
                      <div className="h-24 rounded-[1.45rem] bg-muted/50" />
                      <div className="h-24 rounded-[1.45rem] bg-muted/50" />
                    </div>
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
