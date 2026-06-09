import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../button";
import styles from "./page-back-button.module.css";

export type PageBackButtonProps = {
  onClick: () => void;
  label?: string;
  direction?: "back" | "forward";
};

export function PageBackButton({
  onClick,
  label = "Back",
  direction = "back",
}: PageBackButtonProps) {
  const Icon = direction === "forward" ? ChevronRight : ChevronLeft;

  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={styles.root}>
      {direction === "back" ? <Icon className={styles.icon} /> : null}
      {label}
      {direction === "forward" ? <Icon className={styles.icon} /> : null}
    </Button>
  );
}
