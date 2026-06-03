import { useMaxSm } from "@/hooks/use-max-sm";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { pinLocationLabel } from "@/lib/pin-geocode";
import { supabase } from "@/lib/supabase";
import type { Pin } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Dialog } from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  FormErrorText,
  FormField,
  FormMutedTextXs,
  PinFormFloatingHost,
  PinFormFooterSplit,
  PinFormPanelCard,
  PinFormPanelDialog,
  PinFormPanelFieldGroup,
} from "@curolia/ui/pin-form";
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

type PinMapQuickAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapId: string;
  pin: Pin | null;
  anchorScreen?: { x: number; y: number } | null;
  onEdit: (pin: Pin) => void;
};

export function PinMapQuickAddDialog({
  open,
  onOpenChange,
  mapId,
  pin,
  anchorScreen = null,
  onEdit,
}: PinMapQuickAddDialogProps) {
  const isNarrow = useMaxSm();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);

  const useFloatingPanel = Boolean(open && pin && anchorScreen && !isNarrow);

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
    if (!open || !pin) return;
    queueMicrotask(() => {
      setTitle(pin.title ?? "");
      setError(null);
    });
  }, [open, pin]);

  useEffect(() => {
    if (!open || !pin) return;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(
        "pin-quick-title",
      ) as HTMLInputElement | null;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, pin]);

  const persistTitleToDb = useCallback(
    async (nextRaw: string) => {
      if (!pin) return;
      const { error: uErr } = await supabase
        .from("pins")
        .update({
          title: nextRaw.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pin.id);
      if (uErr) throw uErr;
      await qc.invalidateQueries({ queryKey: ["pins", mapId] });
      await qc.invalidateQueries({ queryKey: ["pin", pin.id] });
    },
    [pin, mapId, qc],
  );

  const flushTitleIfNeeded = useCallback(async () => {
    if (!pin) return;
    const next = title.trim();
    const prev = (pin.title ?? "").trim();
    if (next === prev) return;
    try {
      await persistTitleToDb(next);
    } catch {
      setTitle(pin.title ?? "");
    }
  }, [pin, title, persistTitleToDb]);

  useEffect(() => {
    if (!open || !pin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        void flushTitleIfNeeded().then(() => onOpenChange(false));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pin, onOpenChange, flushTitleIfNeeded]);

  async function onTitleBlur() {
    await flushTitleIfNeeded();
  }

  async function onDelete() {
    if (!pin || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: dErr } = await supabase
        .from("pins")
        .delete()
        .eq("id", pin.id);
      if (dErr) throw dErr;
      await qc.invalidateQueries({ queryKey: ["pins", mapId] });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open || !pin) return null;

  const footer = (
    <PinFormFooterSplit
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
              void flushTitleIfNeeded().then(() => onEdit(pin));
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
  );

  const derivedLocationLabel = pin ? pinLocationLabel(pin) : null;

  const fields = (
    <>
      <PinFormPanelFieldGroup>
        <FormField>
          <Label htmlFor="pin-quick-title">Title</Label>
          <Input
            id="pin-quick-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void onTitleBlur()}
            autoComplete="off"
          />
        </FormField>
        {derivedLocationLabel ? (
          <FormMutedTextXs>{derivedLocationLabel}</FormMutedTextXs>
        ) : null}
      </PinFormPanelFieldGroup>
      {error ? <FormErrorText>{error}</FormErrorText> : null}
    </>
  );

  if (useFloatingPanel && anchorScreen) {
    return (
      <PinFormFloatingHost hostRef={floatingRef}>
        <PinFormPanelCard title="New pin" footerBetween footer={footer}>
          {fields}
        </PinFormPanelCard>
      </PinFormFloatingHost>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) void flushTitleIfNeeded().then(() => onOpenChange(false));
      }}
    >
      <PinFormPanelDialog title="New pin" footerBetween footer={footer}>
        {fields}
      </PinFormPanelDialog>
    </Dialog>
  );
}
