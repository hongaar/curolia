import type { ReactNode } from "react";

import { Dialog } from "../dialog";
import { PageBackButton } from "../page-back-button";
import {
  PanelDialogBody,
  PanelDialogContent,
  PanelDialogSection,
  PanelDialogTitle,
} from "../panel-dialog";
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
      <PanelDialogContent>
        <PanelDialogSection>
          {showPanel && onBack ? (
            <div className={styles.backRow}>
              <PageBackButton onClick={onBack} label={backLabel} />
            </div>
          ) : null}
          <PanelDialogTitle>{title}</PanelDialogTitle>
        </PanelDialogSection>
        <PanelDialogBody className={styles.body}>
          {showPanel ? panel : main}
        </PanelDialogBody>
      </PanelDialogContent>
    </Dialog>
  );
}
