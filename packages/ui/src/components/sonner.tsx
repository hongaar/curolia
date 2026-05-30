"use client";

import type * as React from "react";
import { useTheme } from "next-themes";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import styles from "./sonner.module.css";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className={styles.icon} />,
        info: <InfoIcon className={styles.icon} />,
        warning: <TriangleAlertIcon className={styles.icon} />,
        error: <OctagonXIcon className={styles.icon} />,
        loading: <Loader2Icon className={`${styles.icon} spin`} />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "curoliaToast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
