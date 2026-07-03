"use client";

import { Copy, Globe, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatConnectorId } from "@/lib/tunnel";
import type { ConnectorInfo } from "@cloudflared/core";

interface ConnectorInfoProps {
  info: ConnectorInfo;
  onCopy: () => void;
}

export function ConnectorInfo({ info, onCopy }: ConnectorInfoProps) {
  return (
    <div className="flex flex-wrap divide-x divide-border rounded-xl border border-border/50 bg-muted/15 sm:flex-nowrap">
      <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5">
        <IdCard className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Connector
          </p>
          <p className="truncate font-mono text-sm text-foreground">
            {formatConnectorId(info.id) ?? "—"}
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5">
        <Globe className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Edge
          </p>
          <p className="truncate font-mono text-sm text-foreground">{info.location ?? "—"}</p>
        </div>
      </div>
      <div className="flex items-center px-2">
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!info.id}
          onClick={onCopy}
          className="rounded-lg"
          aria-label="Copy connector ID"
        >
          <Copy className="size-3.5" strokeWidth={1.8} />
        </Button>
      </div>
    </div>
  );
}
