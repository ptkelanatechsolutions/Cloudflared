"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { ToggleOption } from "@/lib/tunnel";

export function ToggleField<T extends string>({
  label,
  description,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: T;
  options: ReadonlyArray<ToggleOption<T>>;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  const gridClassName =
    options.length === 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-1";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </Label>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-[1.4rem] border border-border bg-muted/30 p-1.5">
        <ToggleGroup
          type="single"
          value={value}
          disabled={disabled}
          onValueChange={(next) => {
            if (next) onChange(next as T);
          }}
          className={cn("grid w-full rounded-[1rem] bg-card p-1", gridClassName)}
        >
          {options.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="h-10 flex-1 rounded-full px-3 text-xs font-medium tracking-[0.14em] uppercase data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
