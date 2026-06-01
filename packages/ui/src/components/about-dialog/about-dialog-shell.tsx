import type { ReactNode } from "react";

import { Dialog } from "../dialog";
import { PageBackButton } from "../page-back-button";
import { PanelDialogContent, PanelDialogTitle } from "../panel-dialog";
import styles from "./about-dialog.module.css";

export type AboutDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onBack?: () => void;
  backLabel?: string;
  main: ReactNode;
  panel?: ReactNode;
  scrollPanel?: boolean;
};

export function AboutDialogShell({
  open,
  onOpenChange,
  title,
  onBack,
  backLabel = "About",
  main,
  panel,
  scrollPanel = Boolean(panel),
}: AboutDialogShellProps) {
  const showPanel = panel != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PanelDialogContent size="md">
        {showPanel && onBack ? (
          <div className={styles.backRow}>
            <PageBackButton onClick={onBack} label={backLabel} />
          </div>
        ) : null}
        <PanelDialogTitle>{title}</PanelDialogTitle>
        <div
          className={
            showPanel && scrollPanel
              ? `${styles.body} ${styles.scrollBody}`
              : styles.body
          }
        >
          {showPanel ? panel : main}
        </div>
      </PanelDialogContent>
    </Dialog>
  );
}
