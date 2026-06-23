"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SwitchField({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </Label>
          <p className="text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
