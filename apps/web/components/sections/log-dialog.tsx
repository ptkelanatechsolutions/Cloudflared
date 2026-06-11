"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownToLine, Loader2, Maximize2, Minus, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eyebrow } from "@/components/eyebrow";
import { cn } from "@/lib/utils";
import { EASE, LOG_FOLLOW_THRESHOLD } from "@/lib/tunnel";
import type { Tunnel } from "@/components/use-tunnel";

const LOG_PREVIEW_LINES = 10;

function getViewport(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
}

export function LogDialog({ t }: { t: Tunnel }) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogScrollRef = useRef<HTMLDivElement>(null);
  const [followLogs, setFollowLogs] = useState(true);

  const scrollPreviewToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = getViewport(el);
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  const scrollDialogToBottom = useCallback(() => {
    const el = dialogScrollRef.current;
    if (!el) return;
    const viewport = getViewport(el);
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  useEffect(() => {
    if (t.logs.length > 0 && !open) {
      requestAnimationFrame(scrollPreviewToBottom);
    }
  }, [t.logs.length, open, scrollPreviewToBottom]);

  useEffect(() => {
    if (open && followLogs) {
      requestAnimationFrame(scrollDialogToBottom);
    }
  }, [open, followLogs, t.logs.length, scrollDialogToBottom]);

  useEffect(() => {
    const el = dialogScrollRef.current;
    if (!el) return;
    const viewport = getViewport(el);
    if (!viewport) return;

    const handleScroll = () => {
      const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setFollowLogs(distance <= LOG_FOLLOW_THRESHOLD);
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [open]);

  const previewLines = t.logs.slice(0, LOG_PREVIEW_LINES);
  const overflowCount = t.logs.length - LOG_PREVIEW_LINES;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            <ScrollText className="size-3.5" strokeWidth={1.8} />
            Event log
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground"
          >
            <Maximize2 className="size-3.5" strokeWidth={1.8} />
            Expand
          </Button>
        </div>

        <div className="relative">
          {t.logs.length === 0 && !t.busy && (
            <p className="py-4 text-center text-sm leading-6 text-muted-foreground">
              No log entries yet.
            </p>
          )}

          {t.logs.length === 0 && t.busy && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
              <span className="text-sm leading-6 text-muted-foreground">Connecting…</span>
            </div>
          )}

          {t.logs.length > 0 && (
            <div ref={scrollRef}>
              <ScrollArea
                className={cn("max-h-[17rem] rounded-[1.6rem] border border-border bg-muted/35")}
              >
                <div className="space-y-0.5 p-4 font-mono text-[13px] leading-6">
                  {previewLines.map((line, i) => (
                    <motion.div
                      key={`${i}-${line.slice(0, 24)}`}
                      initial={{ opacity: 0, x: t.reducedMotion ? 0 : -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, ease: EASE, delay: 0.03 * i }}
                    >
                      {line}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <AnimatePresence>
            {overflowCount > 0 && (
              <motion.div
                key="overflow-badge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="mt-2 flex justify-center"
              >
                <Badge
                  variant="outline"
                  onClick={() => setOpen(true)}
                  className="cursor-pointer rounded-full px-3 py-1 text-xs transition-colors hover:bg-muted"
                >
                  +{overflowCount} more {overflowCount === 1 ? "entry" : "entries"}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[80vh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 p-0"
        >
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b border-border px-6 py-4">
            <DialogTitle className="sr-only">Full event log</DialogTitle>
            <Eyebrow icon={ScrollText}>Full event log</Eyebrow>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={t.handleExportLogs}
                disabled={t.logs.length === 0}
                className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground"
              >
                <ArrowDownToLine className="size-3.5" strokeWidth={1.8} />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground"
              >
                <Minus className="size-3.5" strokeWidth={1.8} />
                Minimize
              </Button>
            </div>
          </DialogHeader>

          <Separator />

          <div className="flex flex-1 overflow-hidden p-0">
            <div ref={dialogScrollRef} className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-0.5 p-6 font-mono text-[13px] leading-7">
                  {t.logs.length === 0 && (
                    <p className="text-muted-foreground">No log entries yet.</p>
                  )}
                  {t.logs.map((line, i) => (
                    <div key={`${i}-${line.slice(0, 24)}`}>{line}</div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
