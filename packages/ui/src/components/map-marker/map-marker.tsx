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
  selected?: boolean;
  hovered?: boolean;
  /** De-emphasize when another marker is selected. */
  dimmed?: boolean;
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
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  interactive: boolean;
  draft: boolean;
}) {
  return cn(
    styles.face,
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

export function MapMarker({
  emoji,
  fill,
  selected = false,
  hovered = false,
  dimmed = false,
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
    selected,
    hovered,
    dimmed,
    interactive,
    draft,
  });
  const inlineStyle = mapMarkerFillStyle(fill, dimmed);

  if (interactive) {
    return (
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
    );
  }

  return (
    <div
      role="presentation"
      aria-hidden
      className={className}
      style={inlineStyle}
    >
      {emoji}
    </div>
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

export function createMapMarkerMount(
  initial: MapMarkerMountOptions,
): MapMarkerMount {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";

  let props: MapMarkerMountOptions = { ...initial };

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
