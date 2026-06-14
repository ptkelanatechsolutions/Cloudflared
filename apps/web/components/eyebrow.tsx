import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Eyebrow({ children, icon: Icon }: { children: React.ReactNode; icon: LucideIcon }) {
  return (
    <Badge
      variant="outline"
      className="rounded-full px-3 py-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
    >
      <Icon className="size-3" strokeWidth={1.8} />
      {children}
    </Badge>
  );
}
