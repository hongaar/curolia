import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { supabase } from "@/lib/supabase";
import type { Trace } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Dialog } from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  FormErrorText,
  FormField,
  FormMutedTextXs,
  TraceFormFloatingHost,
  TraceFormFooterSplit,
  TraceFormModalContent,
  TraceFormPanelCard,
} from "@curolia/ui/curolia/trace-form-ui";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMaxSm } from "@/hooks/use-max-sm";

type TraceMapQuickAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalId: string;
  trace: Trace | null;
  anchorScreen?: { x: number; y: number } | null;
  onEdit: (trace: Trace) => void;
};

export function TraceMapQuickAddDialog({
  open,
  onOpenChange,
  journalId,
  trace,
  anchorScreen = null,
  onEdit,
}: TraceMapQuickAddDialogProps) {
  const isNarrow = useMaxSm();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  const useFloatingPanel = Boolean(open && trace && anchorScreen && !isNarrow);

  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect() {
        const a = anchorRef.current;
        if (!a) return new DOMRect(0, 0, 0, 0);
        return new DOMRect(a.x, a.y, 0, 0);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    anchorRef.current = anchorScreen;
  }, [anchorScreen]);

  useLayoutEffect(() => {
    if (!useFloatingPanel) return;
    const floating = floatingRef.current;
    if (!floating || !anchorRef.current) return;

    const run = () =>
      computePosition(virtualReference, floating, {
        placement: "right",
        strategy: "fixed",
        middleware: mapAnchorPanelMiddleware(),
      }).then((data) => {
        const el = floatingRef.current;
        if (!el) return;
        Object.assign(el.style, {
          position: "fixed",
          left: `${data.x}px`,
          top: `${data.y}px`,
          right: "auto",
          bottom: "auto",
        });
      });

    void run();
    return autoUpdate(virtualReference, floating, run, {
      animationFrame: true,
      layoutShift: true,
    });
  }, [useFloatingPanel, virtualReference]);

  useEffect(() => {
    if (!open || !trace) return;
    queueMicrotask(() => {
      setTitle(trace.title ?? "");
      setError(null);
    });
  }, [open, trace]);

  useEffect(() => {
    if (!open || !trace) return;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(
        "trace-quick-title",
      ) as HTMLInputElement | null;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, trace]);

  const persistTitleToDb = useCallback(
    async (nextRaw: string) => {
      if (!trace) return;
      const { error: uErr } = await supabase
        .from("traces")
        .update({
          title: nextRaw.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", trace.id);
      if (uErr) throw uErr;
      await qc.invalidateQueries({ queryKey: ["traces", journalId] });
      await qc.invalidateQueries({ queryKey: ["trace", trace.id] });
    },
    [trace, journalId, qc],
  );

  const flushTitleIfNeeded = useCallback(async () => {
    if (!trace) return;
    const next = title.trim();
    const prev = (trace.title ?? "").trim();
    if (next === prev) return;
    try {
      await persistTitleToDb(next);
    } catch {
      setTitle(trace.title ?? "");
    }
  }, [trace, title, persistTitleToDb]);

  useEffect(() => {
    if (!open || !trace) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void flushTitleIfNeeded().then(() => onOpenChange(false));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, trace, onOpenChange, flushTitleIfNeeded]);

  async function onTitleBlur() {
    await flushTitleIfNeeded();
  }

  async function onDelete() {
    if (!trace || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: dErr } = await supabase
        .from("traces")
        .delete()
        .eq("id", trace.id);
      if (dErr) throw dErr;
      await qc.invalidateQueries({ queryKey: ["traces", journalId] });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !trace) return null;

  const formShell = (
    <TraceFormPanelCard
      title="New trace"
      footerBetween
      footer={
        <TraceFormFooterSplit
          start={
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              Delete
            </Button>
          }
          end={
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  void flushTitleIfNeeded().then(() => onEdit(trace));
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  void flushTitleIfNeeded().then(() => onOpenChange(false));
                }}
              >
                Done
              </Button>
            </>
          }
        />
      }
    >
      <FormField>
        <Label htmlFor="trace-quick-title">Title</Label>
        <Input
          id="trace-quick-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => void onTitleBlur()}
          autoComplete="off"
        />
      </FormField>
      {trace.location_label ? (
        <FormMutedTextXs>{trace.location_label}</FormMutedTextXs>
      ) : null}
      {error ? <FormErrorText>{error}</FormErrorText> : null}
    </TraceFormPanelCard>
  );

  if (useFloatingPanel && anchorScreen) {
    return (
      <TraceFormFloatingHost hostRef={floatingRef}>
        {formShell}
      </TraceFormFloatingHost>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) void flushTitleIfNeeded().then(() => onOpenChange(false));
      }}
    >
      <TraceFormModalContent>{formShell}</TraceFormModalContent>
    </Dialog>
  );
}
