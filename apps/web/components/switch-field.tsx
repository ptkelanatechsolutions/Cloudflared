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
    <div className="rounded-[1.5rem] border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {label}
          </Label>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
