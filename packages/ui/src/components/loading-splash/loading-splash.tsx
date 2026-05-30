import { useEffect, useState } from "react";

import { cn } from "../../lib/utils";
import styles from "./loading-splash.module.css";

const SHOW_LOGO_AFTER_MS = 200;

export type CuroliaLoadingSplashProps = {
  statusLabel?: string;
  fill?: boolean;
};

export function CuroliaLoadingSplash({
  statusLabel = "Loading",
  fill = false,
}: CuroliaLoadingSplashProps) {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowLogo(true), SHOW_LOGO_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className={cn(styles.root, fill && styles.fill)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="srOnly">{statusLabel}</span>
      <div className={styles.logoWrap}>
        {showLogo ? (
          <img
            src="/favicon.png"
            alt=""
            width={96}
            height={96}
            decoding="async"
            className={cn(styles.logo, styles.logoMotion, "splashPulse")}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
