export function RuntimeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-border bg-muted/25 px-4 py-3">
      <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground capitalize">{value}</p>
    </div>
  );
}
