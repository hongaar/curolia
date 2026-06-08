import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./file-upload.module.css";

export function FileUploadRow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="file-upload-row"
      className={cn(styles.row, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function FileUploadLabel({
  className,
  children,
  input,
  ...props
}: React.ComponentProps<"label"> & {
  input: React.ReactNode;
}) {
  return (
    <label
      data-slot="file-upload-label"
      className={cn(styles.label, className)}
      {...props}
    >
      {children}
      {input}
    </label>
  );
}

export function FileUploadInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="file-upload-input"
      className={cn(styles.input, className)}
      {...props}
    />
  );
}
