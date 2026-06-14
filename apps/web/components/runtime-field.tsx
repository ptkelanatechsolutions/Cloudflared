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
    <div className="rounded-3xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase">
        <Icon className="size-3.5" strokeWidth={1.8} />
        {label}
      </div>
      <p className="mt-3 text-sm leading-6 font-medium text-foreground">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{hint}</p>
    </div>
  );
}
