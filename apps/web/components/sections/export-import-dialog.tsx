"use client";

import { Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SwitchField } from "@/components/switch-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eyebrow } from "@/components/eyebrow";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (includeToken: boolean) => void;
  onImport: (json: string) => Promise<void>;
  includeToken: boolean;
  onIncludeTokenChange: (v: boolean) => void;
  disabled: boolean;
}

export function ExportImportDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
  includeToken,
  onIncludeTokenChange,
  disabled,
}: ExportImportDialogProps) {
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (
      window.confirm(
        "This will overwrite the current tunnel configuration and restart the tunnel. Continue?",
      )
    ) {
      await onImport(text);
    }
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Export / Import Config</DialogTitle>
          <Eyebrow icon={Settings}>Export / Import Config</Eyebrow>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-2 pb-6">
          {/* Export */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Export</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Download the current configuration as a JSON file.
            </p>
            <SwitchField
              label="Include tunnel token"
              description="The token grants access to your tunnel. Handle it securely."
              checked={includeToken}
              onCheckedChange={onIncludeTokenChange}
            />
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => onExport(includeToken)}
              className="w-full"
            >
              <Download className="size-4" strokeWidth={1.8} />
              Download config
            </Button>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Import</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Restore a previously exported config file. This will overwrite the current
              configuration.
            </p>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Config file
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".json"
                  disabled={disabled}
                  onChange={handleImportFile}
                  className="file:cursor-pointer file:border-0 file:bg-transparent file:text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
