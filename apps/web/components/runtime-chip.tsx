export function RuntimeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3.5 py-2.5">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground capitalize">{value}</p>
    </div>
  );
}
