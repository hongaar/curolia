import { Fragment, type ReactNode } from "react";

/** Join location/date and optional plugin fragments for pin detail subtitle. */
export function combinePinDetailSubtitle(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(" · ");
}

/** React variant: joins subtitle parts with middle dots. */
export function composePinDetailSubtitleParts(
  ...parts: (ReactNode | null | undefined)[]
): ReactNode {
  const filtered = parts.filter(
    (part) => part != null && part !== "" && part !== false,
  );
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? " · " : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}
