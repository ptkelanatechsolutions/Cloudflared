import type { ReactNode } from "react";

export function InputContainer({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 p-1.5">
      <div className="rounded-lg bg-card p-1">{children}</div>
    </div>
  );
}
