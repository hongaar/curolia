import type { ReactNode } from "react";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from "../dialog";
import { PageBackButton } from "../page-back-button";
import styles from "./about-dialog.module.css";

export type AboutDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  main: ReactNode;
  panel?: ReactNode;
};

export function AboutDialogShell({
  open,
  onOpenChange,
  title,
  onBack,
  backLabel = "About",
  main,
  panel,
}: AboutDialogShellProps) {
  const showPanel = panel != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {showPanel && onBack ? (
          <DialogSection>
            <div className={styles.backRow}>
              <PageBackButton onClick={onBack} label={backLabel} />
            </div>
          </DialogSection>
        ) : null}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody className={styles.body}>
          {showPanel ? panel : main}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
