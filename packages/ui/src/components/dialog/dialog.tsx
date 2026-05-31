import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import styles from "./dialog.module.css";

const DialogDepthContext = React.createContext(0);
const DialogOpenContext = React.createContext(false);

function dialogLayerZIndex(depth: number, layer: "overlay" | "content") {
  const base = 70 + (depth - 1) * 10;
  return layer === "overlay" ? base : base + 1;
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  const parentDepth = React.useContext(DialogDepthContext);
  const depth = parentDepth + 1;
  return (
    <DialogDepthContext.Provider value={depth}>
      <DialogOpenContext.Provider value={Boolean(props.open)}>
        <DialogPrimitive.Root data-slot="dialog" {...props} />
      </DialogOpenContext.Provider>
    </DialogDepthContext.Provider>
  );
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  style,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const depth = React.useContext(DialogDepthContext);
  const isNested = depth > 1;
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      data-dialog-depth={depth}
      className={cn(
        styles.overlay,
        isNested && styles.overlayNested,
        "overlayFadeOpen",
        "overlayFadeClosed",
        className,
      )}
      style={{
        ...style,
        zIndex: dialogLayerZIndex(depth, "overlay"),
      }}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  const depth = React.useContext(DialogDepthContext);
  const open = React.useContext(DialogOpenContext);
  const isNested = depth > 1;
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || !isNested) return;
    const popups = [
      ...document.querySelectorAll<HTMLElement>('[data-slot="dialog-content"]'),
    ];
    const idx = popupRef.current
      ? popups.indexOf(popupRef.current)
      : popups.length - 1;
    const parent = idx > 0 ? popups[idx - 1] : null;
    parent?.setAttribute("data-dialog-obscured", "true");
    return () => {
      parent?.removeAttribute("data-dialog-obscured");
    };
  }, [open, isNested]);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        data-dialog-depth={depth}
        className={cn(
          styles.content,
          isNested && styles.contentNested,
          styles.contentOpen,
          styles.contentClosed,
          className,
        )}
        style={{
          ...style,
          zIndex: dialogLayerZIndex(depth, "content"),
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className={styles.closeAbsolute}
              />
            }
          >
            <XIcon />
            <span className="srOnly">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(styles.header, className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(styles.footer, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(styles.title, className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(styles.description, className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
