"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import styles from "./sonner.module.css";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-left"
      offset={{
        left: "calc(1rem + var(--safe-left))",
        bottom: "calc(1.5rem + var(--safe-bottom))",
      }}
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
