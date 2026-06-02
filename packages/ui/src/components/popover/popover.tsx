"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./popover.module.css";

const PopoverAnchorContext =
  React.createContext<React.RefObject<HTMLElement | null> | null>(null);

function Popover({ children, ...props }: PopoverPrimitive.Root.Props) {
  const anchorRef = React.useRef<HTMLElement | null>(null);
  return (
    <PopoverAnchorContext.Provider value={anchorRef}>
      <PopoverPrimitive.Root data-slot="popover" {...props}>
        {children}
      </PopoverPrimitive.Root>
    </PopoverAnchorContext.Provider>
  );
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

const PopoverAnchor = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function PopoverAnchor({ className, ...props }, forwardedRef) {
  const anchorRef = React.useContext(PopoverAnchorContext);
  if (!anchorRef) {
    throw new Error("PopoverAnchor must be used within <Popover>.");
  }

  return (
    <div
      ref={(node) => {
        anchorRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      data-slot="popover-anchor"
      className={className}
      {...props}
    />
  );
});

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverPrimitive.Popup.Props &
    Pick<
      PopoverPrimitive.Positioner.Props,
      "align" | "alignOffset" | "anchor" | "side" | "sideOffset"
    >
>(function PopoverContent(
  {
    className,
    align = "center",
    alignOffset = 0,
    side = "bottom",
    sideOffset = 4,
    anchor: anchorProp,
    ...props
  },
  ref,
) {
  const contextAnchor = React.useContext(PopoverAnchorContext);
  const anchor = anchorProp ?? contextAnchor ?? undefined;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
        className={styles.positioner}
      >
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="popover-content"
          className={cn(
            styles.content,
            "overlayOpen",
            "overlayClosed",
            className,
          )}
          initialFocus={false}
          finalFocus={false}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
});

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn(styles.header, className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn(styles.title, className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn(styles.description, className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
