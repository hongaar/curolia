import { Button as ButtonPrimitive } from "@base-ui/react/button";
import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./button.module.css";

type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

const variantClass: Record<ButtonVariant, string> = {
  default: styles.variantDefault,
  outline: styles.variantOutline,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  destructive: styles.variantDestructive,
  link: styles.variantLink,
};

const sizeClass: Record<ButtonSize, string> = {
  default: styles.sizeDefault,
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
  "icon-xs": styles.sizeIconXs,
  "icon-sm": styles.sizeIconSm,
  "icon-lg": styles.sizeIconLg,
};

function buttonClassName({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(styles.root, variantClass[variant], sizeClass[size], className);
}

const Button = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonPrimitive.Props, "className"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
  }
>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    nativeButton,
    render,
    ...props
  },
  ref,
) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={buttonClassName({ variant, size, className })}
      nativeButton={nativeButton ?? (render != null ? false : undefined)}
      render={render}
      {...props}
    />
  );
});

export { Button, buttonClassName, type ButtonSize, type ButtonVariant };
