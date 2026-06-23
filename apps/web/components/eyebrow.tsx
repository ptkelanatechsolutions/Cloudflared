import type { LucideIcon } from "lucide-react";

export function Eyebrow({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
      <Icon className="size-3.5" strokeWidth={1.8} />
      {children}
    </span>
  );
}
