"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import * as React from "react";

import { perfProbeCount } from "../../lib/perf-probe-hook";
import { cn } from "../../lib/utils";
import { Sheet, SheetOverlay, SheetPortal, SheetTitle } from "../sheet";
import { BottomSheetDismissContext } from "./bottom-sheet-dismiss-context";
import { bottomSheetDragThresholds } from "./bottom-sheet-drag";
import styles from "./bottom-sheet.module.css";
import { useBottomSheetHistory } from "./use-bottom-sheet-history";

const EXPAND_DRAG_PX = 56;
const DISMISS_ANIMATION_MS = 320;

type BottomSheetSnap = "partial" | "full";
type EnterPhase = "offscreen" | "animating" | "onscreen";

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible label (visually hidden). */
  title: string;
  children: React.ReactNode;
  /** Transparent overlay for map contexts. */
  overlay?: "default" | "none";
  /** Push history while open so back closes the sheet. */
  syncHistoryBack?: boolean;
  /** Partial snap height. */
  partialHeight?: string;
  className?: string;
  bodyClassName?: string;
  modal?: boolean;
  /** Click/tap on the backdrop closes the sheet. */
  dismissOnOutsideClick?: boolean;
  /** Optional ref populated with the animated dismiss function. */
  dismissRef?: React.MutableRefObject<(() => void) | null>;
  /** Runs after close animation and `onOpenChange(false)` (e.g. clear URL params). */
  onExitComplete?: () => void;
  /** Keep body from scrolling; flex child fills height and scrolls internally. */
  containBody?: boolean;
  /** Optional ref to the sheet popup element (for layout measurement). */
  popupRef?: React.Ref<HTMLDivElement>;
  /** Fires when the dismiss slide-down animation begins. */
  onDismissStart?: () => void;
  /** Fires once when the enter animation reaches the on-screen snap. */
  onEnterComplete?: () => void;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  overlay = "default",
  syncHistoryBack = true,
  partialHeight = "min(85dvh, 36rem)",
  className,
  bodyClassName,
  modal = false,
  dismissOnOutsideClick = true,
  dismissRef,
  onExitComplete,
  containBody = false,
  popupRef: popupRefProp,
  onDismissStart,
  onEnterComplete,
}: BottomSheetProps) {
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const setPopupRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      popupRef.current = node;
      if (!popupRefProp) return;
      if (typeof popupRefProp === "function") popupRefProp(node);
      else popupRefProp.current = node;
    },
    [popupRefProp],
  );
  const programmaticDismissRef = React.useRef(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const enterRafRef = React.useRef(0);
  const closingRef = React.useRef(false);
  const prevOpenRef = React.useRef(open);
  const prevEnterPhaseRef = React.useRef<EnterPhase>("onscreen");
  const [rendered, setRendered] = React.useState(open);
  const [sheetOpen, setSheetOpen] = React.useState(open);
  const [snap, setSnap] = React.useState<BottomSheetSnap>("partial");
  const [dragY, setDragY] = React.useState(0);
  const dragYRef = React.useRef(0);
  const [dragHeightPx, setDragHeightPx] = React.useState<number | null>(null);
  const dragHeightPxRef = React.useRef<number | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const draggingRef = React.useRef(false);
  const [enterPhase, setEnterPhase] = React.useState<EnterPhase>("onscreen");
  const dragRef = React.useRef({
    pointerId: -1,
    startY: 0,
    startSnap: "partial" as BottomSheetSnap,
    startHeightPx: 0,
  });
  const outsidePointerRef = React.useRef({
    pointerId: -1,
    moved: false,
    startX: 0,
    startY: 0,
  });

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current !== undefined) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }, []);

  const clearEnterRaf = React.useCallback(() => {
    if (enterRafRef.current) {
      cancelAnimationFrame(enterRafRef.current);
      enterRafRef.current = 0;
    }
  }, []);

  const resetDrag = React.useCallback(() => {
    dragYRef.current = 0;
    setDragY(0);
    dragHeightPxRef.current = null;
    setDragHeightPx(null);
  }, []);

  const finishClose = React.useCallback(() => {
    resetDrag();
    setSnap("partial");
    setEnterPhase("onscreen");
    setSheetOpen(false);
    setRendered(false);
    onOpenChange(false);
    if (onExitComplete) {
      window.setTimeout(onExitComplete, 0);
    }
  }, [onOpenChange, onExitComplete, resetDrag]);

  const dismiss = React.useCallback(
    (fromDragY = 0) => {
      if (closingRef.current) return;
      onDismissStart?.();
      programmaticDismissRef.current = true;
      closingRef.current = true;
      draggingRef.current = false;
      setDragging(false);
      clearCloseTimer();
      clearEnterRaf();
      setEnterPhase("onscreen");

      const popup = popupRef.current;
      const measuredHeight =
        popup?.getBoundingClientRect().height ?? window.innerHeight;

      dragYRef.current = fromDragY;
      setDragY(fromDragY);

      requestAnimationFrame(() => {
        dragYRef.current = measuredHeight;
        setDragY(measuredHeight);
      });

      closeTimerRef.current = setTimeout(() => {
        finishClose();
      }, DISMISS_ANIMATION_MS);
    },
    [clearCloseTimer, clearEnterRaf, finishClose, onDismissStart],
  );

  const startEnterAnimation = React.useCallback(() => {
    perfProbeCount("sheetAnimationReset");
    clearEnterRaf();
    setEnterPhase("offscreen");
    enterRafRef.current = requestAnimationFrame(() => {
      enterRafRef.current = requestAnimationFrame(() => {
        enterRafRef.current = 0;
        setEnterPhase("animating");
        requestAnimationFrame(() => {
          setEnterPhase("onscreen");
        });
      });
    });
  }, [clearEnterRaf]);

  useBottomSheetHistory(
    open && rendered,
    dismiss,
    syncHistoryBack,
    programmaticDismissRef,
  );

  React.useEffect(() => {
    if (!dismissRef) return;
    dismissRef.current = () => dismiss(dragYRef.current);
    return () => {
      dismissRef.current = null;
    };
  }, [dismissRef, dismiss]);

  React.useLayoutEffect(() => {
    if (!rendered) return;
    startEnterAnimation();
    return clearEnterRaf;
  }, [rendered, startEnterAnimation, clearEnterRaf]);

  React.useEffect(() => {
    const prev = prevEnterPhaseRef.current;
    prevEnterPhaseRef.current = enterPhase;
    if (
      prev !== "onscreen" &&
      enterPhase === "onscreen" &&
      sheetOpen &&
      !closingRef.current
    ) {
      onEnterComplete?.();
    }
  }, [enterPhase, sheetOpen, onEnterComplete]);

  React.useEffect(() => {
    const prevOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open) {
      // Parent may still pass open=true while our dismiss animation runs — do not
      // reset closingRef until the prop drops false. A false→true transition is a
      // genuine reopen after close completed.
      if (closingRef.current) {
        if (prevOpen) return;
        closingRef.current = false;
        programmaticDismissRef.current = false;
      }
      clearCloseTimer();
      closingRef.current = false;
      programmaticDismissRef.current = false;
      setRendered(true);
      setSheetOpen(true);
      setSnap("partial");
      resetDrag();
      return;
    }

    if (closingRef.current) return;

    if (rendered) {
      dismiss(dragYRef.current);
    }
  }, [open, rendered, dismiss, clearCloseTimer, resetDrag]);

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const finishDrag = React.useCallback(
    (offset: number, totalDeltaY: number, startSnap: BottomSheetSnap) => {
      const sheetHeight =
        popupRef.current?.getBoundingClientRect().height ??
        window.innerHeight * 0.85;
      const { collapse, close } = bottomSheetDragThresholds(sheetHeight);

      if (startSnap === "full") {
        if (offset >= close) {
          dismiss(offset);
          return;
        }
        if (offset >= collapse) {
          setSnap("partial");
          resetDrag();
          return;
        }
        resetDrag();
        return;
      }

      if (offset >= close) {
        dismiss(offset);
        return;
      }

      if (totalDeltaY <= -EXPAND_DRAG_PX) {
        setSnap("full");
        resetDrag();
        return;
      }

      resetDrag();
    },
    [dismiss, resetDrag],
  );

  const onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetOpen || closingRef.current || enterPhase !== "onscreen") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startHeightPx =
      popupRef.current?.getBoundingClientRect().height ??
      window.innerHeight * 0.5;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startSnap: snap,
      startHeightPx,
    };
    draggingRef.current = true;
    setDragging(true);
  };

  const onHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragRef.current.startY;
    const { startSnap, startHeightPx } = dragRef.current;

    if (startSnap === "partial" && deltaY < 0) {
      const nextHeight = Math.min(startHeightPx - deltaY, window.innerHeight);
      dragHeightPxRef.current = nextHeight;
      setDragHeightPx(nextHeight);
      dragYRef.current = 0;
      setDragY(0);
      return;
    }

    dragHeightPxRef.current = null;
    setDragHeightPx(null);
    const offset = Math.max(0, deltaY);
    dragYRef.current = offset;
    setDragY(offset);
  };

  const onHandlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    draggingRef.current = false;
    setDragging(false);

    const totalDeltaY = event.clientY - dragRef.current.startY;
    finishDrag(dragYRef.current, totalDeltaY, dragRef.current.startSnap);
  };

  const onHandlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    draggingRef.current = false;
    setDragging(false);
    resetDrag();
  };

  const onOutsidePointerDown = (event: React.PointerEvent) => {
    if (!dismissOnOutsideClick || closingRef.current) return;
    outsidePointerRef.current = {
      pointerId: event.pointerId,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const onOutsidePointerMove = (event: React.PointerEvent) => {
    const state = outsidePointerRef.current;
    if (state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (dx * dx + dy * dy > 64) {
      state.moved = true;
    }
  };

  const onOutsidePointerUp = (event: React.PointerEvent) => {
    const state = outsidePointerRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (!state.moved) dismiss(0);
    outsidePointerRef.current = {
      pointerId: -1,
      moved: false,
      startX: 0,
      startY: 0,
    };
  };

  if (!rendered) return null;

  const height =
    dragHeightPx != null
      ? `${dragHeightPx}px`
      : snap === "full"
        ? "100dvh"
        : partialHeight;
  const sheetY = enterPhase === "onscreen" ? `${Math.max(0, dragY)}px` : "100%";
  const isEntering = enterPhase === "offscreen";

  return (
    <BottomSheetDismissContext.Provider value={dismiss}>
      <Sheet
        open={sheetOpen}
        modal={modal}
        disablePointerDismissal
        onOpenChange={(nextOpen) => {
          if (!nextOpen) dismiss(dragYRef.current);
        }}
      >
        <SheetPortal>
          {overlay === "none" ? (
            <SheetPrimitive.Backdrop
              data-slot="bottom-sheet-scrim"
              className={styles.scrimNone}
            />
          ) : (
            <SheetOverlay
              className={styles.overlayDefault}
              onPointerDown={onOutsidePointerDown}
              onPointerMove={onOutsidePointerMove}
              onPointerUp={onOutsidePointerUp}
              onPointerCancel={onOutsidePointerUp}
            />
          )}
          <SheetPrimitive.Popup
            ref={setPopupRef}
            data-slot="bottom-sheet"
            data-side="bottom"
            data-snap={snap}
            className={cn(
              styles.sheet,
              snap === "full" && styles.sheetFull,
              dragging && styles.sheetDragging,
              isEntering && styles.sheetEntering,
              className,
            )}
            style={
              {
                height,
                "--sheet-y": sheetY,
              } as React.CSSProperties
            }
            onTransitionEnd={(event) => {
              if (
                event.propertyName !== "transform" ||
                !closingRef.current ||
                event.target !== event.currentTarget
              ) {
                return;
              }
              const targetY = dragYRef.current;
              if (targetY <= 0) return;
              clearCloseTimer();
              finishClose();
            }}
          >
            <div
              className={styles.handleArea}
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerCancel}
            >
              <div className={styles.handle} aria-hidden />
            </div>
            <SheetTitle className={styles.titleHidden}>{title}</SheetTitle>
            <div
              className={cn(
                styles.body,
                containBody && styles.bodyContain,
                bodyClassName,
              )}
            >
              {children}
            </div>
          </SheetPrimitive.Popup>
        </SheetPortal>
      </Sheet>
    </BottomSheetDismissContext.Provider>
  );
}
