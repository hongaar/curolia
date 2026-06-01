/* eslint-disable react-hooks/set-state-in-effect -- router-driven stack mount list + push/pop exit animations */
import { useFrozenBaseLocation } from "@/hooks/use-frozen-base-location";
import { useStackTransitions } from "@/hooks/use-stack-transitions";
import {
  getStackChain,
  orderStackPaths,
  shouldAnimateStackTransition,
  stackLocationForPathname,
  stackTransitionDirection,
} from "@/lib/stack-routes";
import { appShellRouteElements } from "@/routes/app-shell-routes";
import { useLayoutEffect, useRef, useState } from "react";
import { Routes, useLocation, useNavigationType } from "react-router-dom";
import styles from "./stack-layout.module.css";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isStackLayerCovered(
  path: string,
  stackChain: readonly string[],
  exitingPath: string | null,
  enteringPath: string | null,
): boolean {
  if (path === exitingPath || path === enteringPath) return false;
  const topIndex = stackChain.length - 1;
  const pathIndex = stackChain.indexOf(path);
  if (pathIndex === topIndex) return false;
  if (enteringPath && pathIndex === topIndex - 1) return false;
  return pathIndex >= 0;
}

function layerClassName(
  covered: boolean,
  animation: "push" | "pop" | null,
): string {
  const parts = [styles.stackLayer];
  if (covered) parts.push(styles.stackLayerCovered);
  if (animation === "push") parts.push(styles.stackLayerPushEnter);
  if (animation === "pop") parts.push(styles.stackLayerPopExit);
  return parts.join(" ");
}

/**
 * Map/blog stay mounted in the base layer; other app routes stack on top.
 * Mobile / native: slide transitions. Desktop: instant swap, floating nav stays visible.
 */
export function StackLayout() {
  const stackTransitions = useStackTransitions();
  const location = useLocation();
  const navigationType = useNavigationType();
  const baseLocation = useFrozenBaseLocation();
  const stackChain = getStackChain(location.pathname);
  const stackActive = stackChain.length > 0;

  const [mountedStackPaths, setMountedStackPaths] = useState<readonly string[]>(
    () => stackChain,
  );
  const [exitingPath, setExitingPath] = useState<string | null>(null);
  const [enteringPath, setEnteringPath] = useState<string | null>(null);

  const prevPathnameRef = useRef(location.pathname);
  const prevKeyRef = useRef(location.key);
  const prevChainRef = useRef(stackChain);

  useLayoutEffect(() => {
    const prevChain = prevChainRef.current;
    const prevPathname = prevPathnameRef.current;
    const sameKey = prevKeyRef.current === location.key;

    prevChainRef.current = stackChain;
    prevPathnameRef.current = location.pathname;
    prevKeyRef.current = location.key;

    if (sameKey) return;

    const canAnimate =
      stackTransitions &&
      shouldAnimateStackTransition(
        prevPathname,
        location.pathname,
        navigationType,
      ) &&
      !prefersReducedMotion();

    if (!canAnimate) {
      setMountedStackPaths(stackChain);
      setExitingPath(null);
      setEnteringPath(null);
      return;
    }

    const direction = stackTransitionDirection(navigationType);

    if (direction === "push") {
      const added = stackChain.find((path) => !prevChain.includes(path));
      setMountedStackPaths(stackChain);
      setExitingPath(null);
      setEnteringPath(added ?? stackChain[stackChain.length - 1] ?? null);
      return;
    }

    const removed = prevChain.find((path) => !stackChain.includes(path));
    setMountedStackPaths([...new Set([...stackChain, ...prevChain])]);
    setExitingPath(removed ?? prevChain[prevChain.length - 1] ?? null);
    setEnteringPath(null);
  }, [
    location.key,
    location.pathname,
    navigationType,
    stackChain,
    stackTransitions,
  ]);

  function onStackAnimationEnd(path: string) {
    if (path !== exitingPath && path !== enteringPath) return;
    setMountedStackPaths(stackChain);
    setExitingPath(null);
    setEnteringPath(null);
  }

  const pathsToRender = orderStackPaths([
    ...new Set([
      ...mountedStackPaths,
      ...stackChain,
      ...(exitingPath ? [exitingPath] : []),
    ]),
  ]);

  return (
    <div className={styles.root}>
      <div
        className={`${styles.baseLayer}${stackActive ? ` ${styles.baseLayerCovered}` : ""}`}
      >
        <Routes location={baseLocation}>{appShellRouteElements}</Routes>
      </div>
      {pathsToRender.map((path, index) => (
        <StackRouteLayer
          key={path}
          path={path}
          leafLocation={location}
          zIndex={10 + index}
          className={layerClassName(
            isStackLayerCovered(path, stackChain, exitingPath, enteringPath),
            path === enteringPath
              ? "push"
              : path === exitingPath
                ? "pop"
                : null,
          )}
          onAnimationEnd={() => onStackAnimationEnd(path)}
        />
      ))}
    </div>
  );
}

function StackRouteLayer({
  path,
  leafLocation,
  zIndex,
  className,
  onAnimationEnd,
}: {
  path: string;
  leafLocation: ReturnType<typeof useLocation>;
  zIndex: number;
  className: string;
  onAnimationEnd: () => void;
}) {
  const stackLocation = stackLocationForPathname(path, leafLocation);

  return (
    <div
      className={className}
      style={{ zIndex }}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        onAnimationEnd();
      }}
    >
      <Routes location={stackLocation}>{appShellRouteElements}</Routes>
    </div>
  );
}
