import type * as React from "react";

import {
  cn,
  contrastingForeground,
  dimmedMapMarkerFill,
} from "../../lib/utils";
import styles from "./map-marker.module.css";

export type MapMarkerProps = {
  emoji: string;
  fill: string | null;
  /** `sm` fits compact rows (e.g. search results). */
  size?: "md" | "sm";
  selected?: boolean;
  hovered?: boolean;
  /** De-emphasize when another marker is selected. */
  dimmed?: boolean;
  /** Stack count when multiple pins share the same map point. */
  badge?: number | null;
  interactive?: boolean;
  draft?: boolean;
  ariaLabel?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onContextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
};

export function mapMarkerFaceClassName(opts: {
  fill: string | null;
  size: "md" | "sm";
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  interactive: boolean;
  draft: boolean;
}) {
  return cn(
    styles.face,
    opts.size === "sm" && styles.faceSm,
    opts.interactive && styles.interactive,
    opts.dimmed && styles.dimmed,
    !opts.fill && styles.defaultFill,
    opts.draft
      ? styles.draft
      : opts.selected
        ? styles.selected
        : opts.hovered
          ? styles.hovered
          : styles.defaultRing,
  );
}

function mapMarkerFillStyle(
  fill: string | null,
  dimmed: boolean,
): React.CSSProperties | undefined {
  if (!fill) return undefined;
  const backgroundColor = dimmed ? dimmedMapMarkerFill(fill) : fill;
  return {
    backgroundColor,
    color: contrastingForeground(backgroundColor),
  };
}

/** Imperative face update — used by MapLibre mounts to avoid React re-renders on hover/selection. */
export function applyMapMarkerFace(el: HTMLElement, props: MapMarkerProps) {
  el.textContent = props.emoji;
  const dimmed = Boolean(props.dimmed);
  el.className = mapMarkerFaceClassName({
    fill: props.fill,
    size: props.size ?? "md",
    selected: Boolean(props.selected),
    hovered: Boolean(props.hovered),
    dimmed,
    interactive: Boolean(props.interactive),
    draft: Boolean(props.draft),
  });
  if (props.fill) {
    const style = mapMarkerFillStyle(props.fill, dimmed);
    el.style.backgroundColor = style?.backgroundColor ?? "";
    el.style.color = style?.color ?? "";
  } else {
    el.style.backgroundColor = "";
    el.style.color = "";
  }
}

function mapMarkerBadgeLabel(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function MapMarkerBadge({ count }: { count: number }) {
  return (
    <span className={styles.badge} aria-hidden>
      {mapMarkerBadgeLabel(count)}
    </span>
  );
}

export function MapMarker({
  emoji,
  fill,
  size = "md",
  selected = false,
  hovered = false,
  dimmed = false,
  badge = null,
  interactive = false,
  draft = false,
  ariaLabel,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: MapMarkerProps) {
  const className = mapMarkerFaceClassName({
    fill,
    size,
    selected,
    hovered,
    dimmed,
    interactive,
    draft,
  });
  const inlineStyle = mapMarkerFillStyle(fill, dimmed);
  const badgeNode =
    badge != null && badge > 1 ? <MapMarkerBadge count={badge} /> : null;

  if (interactive) {
    return (
      <span className={styles.host}>
        <button
          type="button"
          className={className}
          style={inlineStyle}
          aria-label={ariaLabel ?? "Open pin"}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {emoji}
        </button>
        {badgeNode}
      </span>
    );
  }

  return (
    <span className={styles.host}>
      <div
        role="presentation"
        aria-hidden
        className={className}
        style={inlineStyle}
      >
        {emoji}
      </div>
      {badgeNode}
    </span>
  );
}

export type MapMarkerMountOptions = MapMarkerProps & {
  pointerEvents?: "none";
  zIndex?: string;
};

export type MapMarkerMount = {
  /** Root element passed to `maplibregl.Marker({ element })`. */
  element: HTMLDivElement;
  update: (patch: Partial<MapMarkerMountOptions>) => void;
  setZIndex: (zIndex: string) => void;
  /** Strip expensive shadows/outlines while the map camera is moving. */
  setCameraMoving: (moving: boolean) => void;
  unmount: () => void;
};

function syncInteractiveHandlers(
  face: HTMLButtonElement,
  props: MapMarkerMountOptions,
) {
  face.onclick = props.onClick
    ? (e) => {
        props.onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    : null;
  face.onpointerdown = props.onPointerDown
    ? (e) => {
        props.onPointerDown?.(
          e as unknown as React.PointerEvent<HTMLButtonElement>,
        );
      }
    : null;
  face.oncontextmenu = props.onContextMenu
    ? (e) => {
        props.onContextMenu?.(
          e as unknown as React.MouseEvent<HTMLButtonElement>,
        );
      }
    : null;
  face.onmouseenter = props.onMouseEnter
    ? (e) => {
        props.onMouseEnter?.(
          e as unknown as React.MouseEvent<HTMLButtonElement>,
        );
      }
    : null;
  face.onmouseleave = props.onMouseLeave
    ? (e) => {
        props.onMouseLeave?.(
          e as unknown as React.MouseEvent<HTMLButtonElement>,
        );
      }
    : null;
}

function syncMapMarkerBadge(
  wrapper: HTMLDivElement,
  badgeEl: HTMLSpanElement | null,
  count: number | null | undefined,
): HTMLSpanElement | null {
  if (count != null && count > 1) {
    const el = badgeEl ?? document.createElement("span");
    el.className = styles.badge;
    el.setAttribute("aria-hidden", "true");
    el.textContent = mapMarkerBadgeLabel(count);
    if (!badgeEl) wrapper.appendChild(el);
    return el;
  }
  badgeEl?.remove();
  return null;
}

export function createMapMarkerMount(
  initial: MapMarkerMountOptions,
): MapMarkerMount {
  const wrapper = document.createElement("div");
  wrapper.className = styles.host;

  let props: MapMarkerMountOptions = { ...initial };
  let badgeEl: HTMLSpanElement | null = null;

  const face = document.createElement(
    props.interactive ? "button" : "div",
  ) as HTMLElement;
  if (props.interactive) {
    const btn = face as HTMLButtonElement;
    btn.type = "button";
    if (props.ariaLabel) btn.setAttribute("aria-label", props.ariaLabel);
    syncInteractiveHandlers(btn, props);
  } else {
    face.setAttribute("role", "presentation");
    face.setAttribute("aria-hidden", "true");
  }
  wrapper.appendChild(face);

  const applyHostStyles = () => {
    wrapper.style.pointerEvents = props.pointerEvents === "none" ? "none" : "";
    if (props.zIndex !== undefined) {
      wrapper.style.zIndex = props.zIndex;
    }
  };

  const renderFace = () => {
    applyMapMarkerFace(face, props);
    if (props.interactive) {
      const btn = face as HTMLButtonElement;
      btn.setAttribute("aria-label", props.ariaLabel ?? "Open pin");
      syncInteractiveHandlers(btn, props);
    }
    badgeEl = syncMapMarkerBadge(wrapper, badgeEl, props.badge);
    applyHostStyles();
  };

  renderFace();

  return {
    element: wrapper,
    setCameraMoving(moving) {
      wrapper.classList.toggle(styles.cameraMoving, moving);
    },
    update(patch) {
      const next = { ...props, ...patch };
      const visualChanged =
        next.emoji !== props.emoji ||
        next.fill !== props.fill ||
        next.selected !== props.selected ||
        next.hovered !== props.hovered ||
        next.dimmed !== props.dimmed ||
        next.badge !== props.badge ||
        next.interactive !== props.interactive ||
        next.draft !== props.draft;
      const handlersChanged =
        patch.onClick !== undefined ||
        patch.onPointerDown !== undefined ||
        patch.onContextMenu !== undefined ||
        patch.onMouseEnter !== undefined ||
        patch.onMouseLeave !== undefined ||
        patch.ariaLabel !== undefined;
      props = next;
      if (visualChanged || handlersChanged) {
        renderFace();
      } else {
        applyHostStyles();
      }
    },
    setZIndex(zIndex) {
      wrapper.style.zIndex = zIndex;
    },
    unmount() {
      wrapper.remove();
    },
  };
}
