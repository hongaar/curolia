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
  ...props
}: React.ComponentProps<"div"> & {
  size?: CardSize;
  variant?: CardVariant;
  surface?: CardSurface;
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-surface={surface === "page" ? "page" : undefined}
      className={cn(styles.card, className)}
      {...props}
    />
  );
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
