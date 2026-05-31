import type * as React from "react";

import { cn, contrastingForeground } from "../../lib/utils";
import styles from "./map-marker.module.css";

export type MapMarkerProps = {
  emoji: string;
  fill: string | null;
  selected?: boolean;
  hovered?: boolean;
  interactive?: boolean;
  draft?: boolean;
  ariaLabel?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
};

export function mapMarkerFaceClassName(opts: {
  fill: string | null;
  selected: boolean;
  hovered: boolean;
  interactive: boolean;
  draft: boolean;
}) {
  return cn(
    styles.face,
    opts.interactive && styles.interactive,
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

/** Imperative face update — used by MapLibre mounts to avoid React re-renders on hover/selection. */
export function applyMapMarkerFace(el: HTMLElement, props: MapMarkerProps) {
  el.textContent = props.emoji;
  el.className = mapMarkerFaceClassName({
    fill: props.fill,
    selected: Boolean(props.selected),
    hovered: Boolean(props.hovered),
    interactive: Boolean(props.interactive),
    draft: Boolean(props.draft),
  });
  if (props.fill) {
    el.style.backgroundColor = props.fill;
    el.style.color = contrastingForeground(props.fill);
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
  interactive = false,
  draft = false,
  ariaLabel,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MapMarkerProps) {
  const className = mapMarkerFaceClassName({
    fill,
    selected,
    hovered,
    interactive,
    draft,
  });
  const inlineStyle: React.CSSProperties | undefined = fill
    ? {
        backgroundColor: fill,
        color: contrastingForeground(fill),
      }
    : undefined;

  if (interactive) {
    return (
      <button
        type="button"
        className={className}
        style={inlineStyle}
        aria-label={ariaLabel ?? "Open trace"}
        onClick={onClick}
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
      btn.setAttribute("aria-label", props.ariaLabel ?? "Open trace");
      syncInteractiveHandlers(btn, props);
    }
    applyHostStyles();
  };

  renderFace();

  return {
    element: wrapper,
    update(patch) {
      const next = { ...props, ...patch };
      const visualChanged =
        next.emoji !== props.emoji ||
        next.fill !== props.fill ||
        next.selected !== props.selected ||
        next.hovered !== props.hovered ||
        next.interactive !== props.interactive ||
        next.draft !== props.draft;
      const handlersChanged =
        patch.onClick !== undefined ||
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
