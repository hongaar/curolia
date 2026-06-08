import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Loader2, XIcon } from "lucide-react";
import * as React from "react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import styles from "./dialog.module.css";

const DialogDepthContext = React.createContext(0);
const DialogOpenContext = React.createContext(false);
/** `true` for `modal={false}` shells — suppresses auto header close unless requested. */
const DialogEmbeddedContext = React.createContext(true);

export type DialogSize = "default" | "wide";

type DialogContentBaseProps = {
  size?: DialogSize;
  /** When `false`, renders the dialog shell inline (map-anchored panels, Storybook fixtures). */
  modal?: boolean;
};

type DialogContentModalProps = DialogContentBaseProps &
  DialogPrimitive.Popup.Props & {
    modal?: true;
  };

type DialogContentEmbeddedProps = DialogContentBaseProps &
  React.ComponentProps<"div"> & {
    modal: false;
  };

export type DialogContentProps =
  | DialogContentModalProps
  | DialogContentEmbeddedProps;

/** Above app chrome (`main-toolbar` z-index 96); below lightbox (200). */
function dialogLayerZIndex(depth: number, layer: "overlay" | "content") {
  const base = 100 + (depth - 1) * 10;
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

function dialogShellClassName({
  size,
  modal,
  isNested,
}: {
  size: DialogSize;
  modal: boolean;
  isNested?: boolean;
}) {
  return cn(
    styles.shell,
    !modal && styles.shellEmbedded,
    size === "wide" && styles.shellWide,
    modal && styles.content,
    modal && isNested && styles.contentNested,
    modal && styles.contentOpen,
    modal && styles.contentClosed,
  );
}

function DialogContent({
  className,
  children,
  size = "default",
  modal = true,
  style,
  ...props
}: DialogContentProps) {
  const depth = React.useContext(DialogDepthContext);
  const open = React.useContext(DialogOpenContext);
  const isNested = depth > 1;
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!modal || !open || !isNested) return;
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
  }, [open, isNested, modal]);

  const shellClassName = cn(
    dialogShellClassName({ size, modal, isNested }),
    className,
  );
  const body = (
    <DialogEmbeddedContext.Provider value={!modal}>
      {children}
    </DialogEmbeddedContext.Provider>
  );

  if (!modal) {
    const { ...divProps } = props as React.ComponentProps<"div">;
    const embeddedStyle = style as React.CSSProperties | undefined;
    return (
      <div
        data-slot="dialog-content"
        className={shellClassName}
        style={embeddedStyle}
        {...divProps}
      >
        {body}
      </div>
    );
  }

  const { ...popupProps } = props as DialogPrimitive.Popup.Props;
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        data-dialog-depth={depth}
        className={shellClassName}
        style={{
          ...style,
          zIndex: dialogLayerZIndex(depth, "content"),
        }}
        {...popupProps}
      >
        {body}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeaderClose({
  className,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Button>, "size" | "variant">) {
  const embedded = React.useContext(DialogEmbeddedContext);
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(styles.headerClose, className)}
      type="button"
      onClick={onClick}
      {...props}
    >
      <XIcon />
      <span className="srOnly">Close</span>
    </Button>
  );

  if (embedded || onClick) return button;

  return <DialogPrimitive.Close data-slot="dialog-close" render={button} />;
}

function DialogHeader({
  className,
  showCloseButton,
  onClose,
  trailing,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /** Modal dialogs show a header close control by default. */
  showCloseButton?: boolean;
  /** For embedded shells (`modal={false}`) without a `Dialog` root. */
  onClose?: () => void;
  /** Override the trailing slot (e.g. custom close wiring). */
  trailing?: ReactNode;
}) {
  const embedded = React.useContext(DialogEmbeddedContext);
  const showClose = showCloseButton ?? (!embedded && trailing === undefined);
  const trailingSlot =
    trailing ??
    (showClose ? (
      <DialogHeaderClose aria-label="Close" onClick={onClose} />
    ) : undefined);

  return (
    <div
      data-slot="dialog-header"
      data-has-trailing={trailingSlot ? "" : undefined}
      className={cn(
        styles.header,
        trailingSlot && styles.headerWithTrailing,
        className,
      )}
      {...props}
    >
      {trailingSlot ? (
        <>
          <div className={styles.headerMain}>{children}</div>
          <div className={styles.headerTrailing}>{trailingSlot}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}

/** Scrollable main area when content exceeds the dialog max height. */
function DialogBody({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-body" className={styles.bodyScroll} {...props}>
      <div className={cn(styles.bodyScrollInner, className)}>{children}</div>
    </div>
  );
}

/** Top block when not using {@link DialogHeader} (e.g. back row + title). */
function DialogSection({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-section"
      className={cn(styles.section, className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  between = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
  /** Primary actions on the right, secondary on the left (row at all breakpoints). */
  between?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(styles.footer, between && styles.footerBetween, className)}
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

/** Left cluster for {@link DialogFooter} `between` layout. */
function DialogFooterStart({ children }: { children: ReactNode }) {
  return <div className={styles.footerStart}>{children}</div>;
}

/** Right cluster for {@link DialogFooter} `between` layout. */
function DialogFooterEnd({ children }: { children: ReactNode }) {
  return <div className={styles.footerEnd}>{children}</div>;
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

/** Heading for non-modal surfaces — must not use {@link DialogTitle}. */
function DialogCardTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>;
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

function DialogFormStack({ children }: { children: ReactNode }) {
  return <div className={styles.formStack}>{children}</div>;
}

function DialogField({ children }: { children: ReactNode }) {
  return <div className={styles.formField}>{children}</div>;
}

function DialogMonoBox({ children }: { children: ReactNode }) {
  return <div className={styles.monoBox}>{children}</div>;
}

function DialogFooterRow({ children }: { children: ReactNode }) {
  return <div className={styles.footerRow}>{children}</div>;
}

function DialogRoundedButton({
  size = "sm",
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      size={size}
      className={cn(styles.roundedButton, className)}
      {...props}
    />
  );
}

function DialogImportButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(styles.importButton, className)}
      {...props}
    />
  );
}

function DialogSpinner() {
  return <Loader2 className={cn(styles.iconSm, "spin")} aria-hidden />;
}

/** In-form prep step (avoids stacking a second modal on pin edit). */
function DialogInlinePrep({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <div className={styles.inlinePrep} role="group" aria-labelledby={titleId}>
      <div className={styles.inlinePrepHeader}>
        <h3 id={titleId} className={styles.inlinePrepTitle}>
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={styles.inlinePrepClose}
          aria-label="Close"
          onClick={onClose}
        >
          <XIcon className={styles.iconSm} aria-hidden />
        </Button>
      </div>
      {description ? (
        <p className={styles.inlinePrepDescription}>{description}</p>
      ) : null}
      <div className={styles.inlinePrepBody}>{children}</div>
    </div>
  );
}

export {
  Dialog,
  DialogBody,
  DialogCardTitle,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogFooterEnd,
  DialogFooterRow,
  DialogFooterStart,
  DialogFormStack,
  DialogHeader,
  DialogHeaderClose,
  DialogImportButton,
  DialogInlinePrep,
  DialogMonoBox,
  DialogOverlay,
  DialogPortal,
  DialogRoundedButton,
  DialogSection,
  DialogSpinner,
  DialogTitle,
  DialogTrigger,
};
