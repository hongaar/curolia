import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./card.module.css";

type CardSize = "default" | "sm";
type CardVariant = "default" | "colored";
type CardSurface = "default" | "page";

function Card({
  className,
  size = "default",
  variant = "default",
  surface = "default",
  mobileCard = false,
  interactive = false,
  active = false,
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  size?: CardSize;
  variant?: CardVariant;
  surface?: CardSurface;
  /** Keep frosted panel chrome on narrow viewports (`surface="page"` only). */
  mobileCard?: boolean;
  /**
   * Clickable tile (render as a link/button): no padding, hover lift and
   * Button-style focus ring. Tint the ring via `--card-focus-color`.
   */
  interactive?: boolean;
  /** Show the focus ring without focus (e.g. item selected elsewhere). */
  active?: boolean;
}) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        "data-slot": "card",
        "data-size": size,
        "data-variant": variant,
        "data-surface": surface === "page" ? "page" : undefined,
        "data-mobile-card": mobileCard ? "" : undefined,
        "data-interactive": interactive ? "" : undefined,
        "data-active": active ? "" : undefined,
        className: cn(styles.card, className),
      } as React.ComponentProps<"div">,
      props,
    ),
    render,
  });
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(styles.header, className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(styles.title, className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(styles.description, className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(styles.action, className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(styles.content, className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(styles.footer, className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardSize,
  type CardSurface,
  type CardVariant,
};
