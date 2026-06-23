import type { LucideIcon } from "lucide-react";

export function RuntimeField({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" strokeWidth={1.8} />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-medium text-foreground">{value}</p>
      <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}
