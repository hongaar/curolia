import type * as React from "react";

import {
  cn,
  contrastingForeground,
  dimmedMapMarkerFill,
} from "../../lib/utils";
import styles from "./map-marker.module.css";

export type MapMarkerSize = "sm" | "md" | "lg";

export type MapMarkerProps = {
  /** Emoji glyph; omitted or empty for solid / photo markers. */
  emoji?: string | null;
  fill: string | null;
  /** Photo preview URL; when set the marker shows a circular photo. */
  photoUrl?: string | null;
  /** Override auto size (`lg` photo, `md` emoji, `sm` otherwise). */
  size?: MapMarkerSize;
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

type MarkerModeInput = {
  photoUrl: string | null;
  emoji: string | null;
};

function normalizePhotoUrl(photoUrl?: string | null): string | null {
  const url = photoUrl?.trim() || null;
  return url;
}

function normalizeEmoji(emoji?: string | null): string | null {
  const glyph = emoji?.trim() || null;
  return glyph;
}

/** Default size from marker mode: `lg` photo, `md` emoji, `sm` otherwise. */
export function resolveMapMarkerSize(
  size: MapMarkerSize | undefined,
  mode: MarkerModeInput,
): MapMarkerSize {
  if (size !== undefined) return size;
  if (mode.photoUrl) return "lg";
  if (mode.emoji) return "md";
  return "sm";
}

export function mapMarkerFaceClassName(opts: {
  fill: string | null;
  size: MapMarkerSize;
  hasPhoto: boolean;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  interactive: boolean;
  draft: boolean;
}) {
  return cn(
    styles.face,
    opts.size === "sm" && styles.faceSm,
    opts.size === "lg" && styles.faceLg,
    opts.hasPhoto && styles.facePhoto,
    opts.hasPhoto && opts.fill && styles.facePhotoTagRing,
    opts.interactive && styles.interactive,
    opts.dimmed && styles.dimmed,
    !opts.hasPhoto && !opts.fill && styles.defaultFill,
    opts.draft
      ? styles.draft
      : opts.selected
        ? styles.selected
        : opts.hovered
          ? styles.hovered
          : null,
  );
}

function mapMarkerFaceStyle(
  fill: string | null,
  dimmed: boolean,
  hasPhoto: boolean,
  photoUrl: string | null,
): React.CSSProperties | undefined {
  if (hasPhoto) {
    return {
      backgroundImage: `url("${photoUrl}")`,
      ["--marker-tag-color" as string]: fill
        ? dimmed
          ? dimmedMapMarkerFill(fill)
          : fill
        : undefined,
    } as React.CSSProperties;
  }

  if (!fill) return undefined;

  const backgroundColor = dimmed ? dimmedMapMarkerFill(fill) : fill;
  return {
    backgroundColor,
    color: contrastingForeground(backgroundColor),
  };
}

function markerModeFromProps(
  props: Pick<MapMarkerProps, "emoji" | "photoUrl">,
): MarkerModeInput {
  return {
    photoUrl: normalizePhotoUrl(props.photoUrl),
    emoji: normalizeEmoji(props.emoji),
  };
}

/** Imperative face update — used by MapLibre mounts to avoid React re-renders on hover/selection. */
export function applyMapMarkerFace(el: HTMLElement, props: MapMarkerProps) {
  const mode = markerModeFromProps(props);
  const hasPhoto = Boolean(mode.photoUrl);
  const dimmed = Boolean(props.dimmed);
  const size = resolveMapMarkerSize(props.size, mode);

  el.textContent = hasPhoto ? "" : (mode.emoji ?? "");
  el.className = mapMarkerFaceClassName({
    fill: props.fill,
    size,
    hasPhoto,
    selected: Boolean(props.selected),
    hovered: Boolean(props.hovered),
    dimmed,
    interactive: Boolean(props.interactive),
    draft: Boolean(props.draft),
  });

  const style = mapMarkerFaceStyle(props.fill, dimmed, hasPhoto, mode.photoUrl);
  if (style) {
    if ("backgroundColor" in style && style.backgroundColor) {
      el.style.backgroundColor = style.backgroundColor;
      el.style.color = style.color ?? "";
    } else {
      el.style.backgroundColor = "";
      el.style.color = "";
    }
    if (style.backgroundImage) {
      el.style.backgroundImage = style.backgroundImage;
    } else {
      el.style.backgroundImage = "";
    }
    const tagColor = (style as Record<string, string | undefined>)[
      "--marker-tag-color"
    ];
    if (tagColor) {
      el.style.setProperty("--marker-tag-color", tagColor);
    } else {
      el.style.removeProperty("--marker-tag-color");
    }
  } else {
    el.style.backgroundColor = "";
    el.style.color = "";
    el.style.backgroundImage = "";
    el.style.removeProperty("--marker-tag-color");
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
  photoUrl,
  size,
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
  const mode = markerModeFromProps({ emoji, photoUrl });
  const hasPhoto = Boolean(mode.photoUrl);
  const resolvedSize = resolveMapMarkerSize(size, mode);
  const className = mapMarkerFaceClassName({
    fill,
    size: resolvedSize,
    hasPhoto,
    selected,
    hovered,
    dimmed,
    interactive,
    draft,
  });
  const inlineStyle = mapMarkerFaceStyle(fill, dimmed, hasPhoto, mode.photoUrl);
  const badgeNode =
    badge != null && badge > 1 ? <MapMarkerBadge count={badge} /> : null;
  const glyph = hasPhoto ? null : mode.emoji;

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
          {glyph}
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
        {glyph}
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
        next.photoUrl !== props.photoUrl ||
        next.size !== props.size ||
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
