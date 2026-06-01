import { useMobileStackLayout } from "@/hooks/use-mobile-stack-layout";
import {
  mobileStackTransitionDirection,
  shouldAnimateMobileStackTransition,
} from "@/lib/mobile-stack-routes";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Outlet,
  useLocation,
  useNavigationType,
  useOutlet,
} from "react-router-dom";
import styles from "./mobile-stack-outlet.module.css";

type TransitionPhase = "idle" | "animating";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * On Capacitor and mobile viewports, animates push/pop between stack routes.
 * Desktop web uses a plain Outlet.
 */
export function MobileStackOutlet() {
  const useStackLayout = useMobileStackLayout();
  if (!useStackLayout) {
    return <Outlet />;
  }
  return <MobileStackOutletInner />;
}

function MobileStackOutletInner() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const outlet = useOutlet();

  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [exitingOutlet, setExitingOutlet] = useState<ReactNode>(null);
  const [direction, setDirection] = useState<"push" | "pop">("push");

  const prevPathnameRef = useRef(location.pathname);
  const prevKeyRef = useRef(location.key);
  const committedOutletRef = useRef(outlet);

  useLayoutEffect(() => {
    if (prevKeyRef.current === location.key) {
      committedOutletRef.current = outlet;
      return;
    }

    const fromPathname = prevPathnameRef.current;
    const animate = shouldAnimateMobileStackTransition(
      fromPathname,
      location.pathname,
      navigationType,
    );

    if (animate && !prefersReducedMotion()) {
      setDirection(mobileStackTransitionDirection(navigationType));
      setExitingOutlet(committedOutletRef.current);
      setPhase("animating");
    } else {
      setPhase("idle");
      setExitingOutlet(null);
    }

    prevPathnameRef.current = location.pathname;
    prevKeyRef.current = location.key;
    committedOutletRef.current = outlet;
  }, [location.key, location.pathname, navigationType, outlet]);

  function finishTransition() {
    setPhase("idle");
    setExitingOutlet(null);
  }

  if (phase === "idle") {
    return <div className={styles.root}>{outlet}</div>;
  }

  const baseLayer = direction === "push" ? exitingOutlet : outlet;
  const overlayLayer = direction === "push" ? outlet : exitingOutlet;
  const overlayClass =
    direction === "push" ? styles.layerPushEnter : styles.layerPopExit;

  return (
    <div className={styles.root}>
      <div className={`${styles.layer} ${styles.layerBase}`}>{baseLayer}</div>
      <div
        className={`${styles.layer} ${styles.layerOverlay} ${overlayClass}`}
        onAnimationEnd={(event) => {
          if (event.target !== event.currentTarget) return;
          finishTransition();
        }}
      >
        {overlayLayer}
      </div>
    </div>
  );
}
