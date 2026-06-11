import { useCallback, useEffect, useRef, useState } from "react";

/** Offset from the scroll viewport top — aligns with anchored section scroll-margin. */
const ACTIVATION_OFFSET_PX = 32;
const NEAR_BOTTOM_PX = 48;

function findScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function resolveActiveSection(
  sectionIds: readonly string[],
  scrollRoot: HTMLElement,
  activationY: number,
): string {
  const lastId = sectionIds[sectionIds.length - 1];
  if (lastId) {
    const nearBottom =
      scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight <
      NEAR_BOTTOM_PX;
    if (nearBottom) return lastId;
  }

  let active = sectionIds[0] ?? "";
  for (const id of sectionIds) {
    const element = document.getElementById(id);
    if (!element) continue;
    if (element.getBoundingClientRect().top <= activationY) {
      active = id;
    } else {
      break;
    }
  }
  return active;
}

/** Tracks which in-page section is active for sticky side nav highlighting. */
export function useActivePageSection(
  sectionIds: readonly string[],
  enabled: boolean,
) {
  const [active, setActive] = useState(sectionIds[0] ?? "");
  const scrollLockRef = useRef<string | null>(null);
  const resolvedActive = sectionIds.includes(active)
    ? active
    : (sectionIds[0] ?? "");

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) return;

    const first = document.getElementById(sectionIds[0]);
    if (!first) return;

    const scrollRoot = findScrollParent(first) ?? document.documentElement;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const activationY =
        scrollRoot.getBoundingClientRect().top + ACTIVATION_OFFSET_PX;

      const locked = scrollLockRef.current;
      if (locked) {
        const lockedEl = document.getElementById(locked);
        if (lockedEl) {
          const lockedTop = lockedEl.getBoundingClientRect().top;
          if (lockedTop > activationY + 2) {
            setActive((current) => (current === locked ? current : locked));
            return;
          }
        }
        scrollLockRef.current = null;
      }

      const next = resolveActiveSection(sectionIds, scrollRoot, activationY);
      setActive((current) => (current === next ? current : next));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, sectionIds]);

  const setActiveSection = useCallback((id: string) => {
    scrollLockRef.current = id;
    setActive(id);
  }, []);

  return { active: resolvedActive, setActiveSection };
}
