import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";

import { cn } from "../lib/utils";
import styles from "./badge.module.css";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

const variantClass: Record<BadgeVariant, string> = {
  default: styles.variantDefault,
  secondary: styles.variantSecondary,
  destructive: styles.variantDestructive,
  outline: styles.variantOutline,
  ghost: styles.variantGhost,
  link: styles.variantLink,
};

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(styles.root, variantClass[variant], className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, type BadgeVariant };
