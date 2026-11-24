import { Check, Copy } from "lucide-react";
import * as React from "react";

import { Button } from "../button";
import styles from "./secret-reveal.module.css";

export type SecretRevealProps = {
  /** Secret shown once (e.g. a freshly created API key). */
  value: string;
  /** Short guidance shown below the value. */
  hint?: React.ReactNode;
  /** Accessible label for the value. */
  label?: string;
  /** Called after the value was copied to the clipboard. */
  onCopied?: () => void;
};

/** Monospace, selectable secret with a copy button, for one-time reveals. */
function SecretReveal({
  value,
  hint,
  label = "Secret",
  onCopied,
}: SecretRevealProps) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div data-slot="secret-reveal" className={styles.root}>
      <div className={styles.row}>
        <code className={styles.value} aria-label={label}>
          {value}
        </code>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}

export { SecretReveal };
