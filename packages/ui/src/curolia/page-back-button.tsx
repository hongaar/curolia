import { Button } from "../components/button";
import { ChevronLeft } from "lucide-react";
import styles from "./page-back-button.module.css";

export type PageBackButtonProps = {
  onClick: () => void;
  label?: string;
};

export function PageBackButton({
  onClick,
  label = "Back",
}: PageBackButtonProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={styles.root}>
      <ChevronLeft className={styles.icon} />
      {label}
    </Button>
  );
}
