import { Fragment } from "react";
import { Check, X } from "lucide-react";
import type { OsmPoiPinSubtitle, OsmPoiSubtitlePart } from "./osm-poi-subtitle";

export type { OsmPoiPinSubtitle, OsmPoiSubtitlePart } from "./osm-poi-subtitle";

function OsmPoiSubtitlePartView({ part }: { part: OsmPoiSubtitlePart }) {
  switch (part.kind) {
    case "text":
      return <span>{part.text}</span>;
    case "wheelchair_friendly":
      return (
        <span>
          Wheelchair friendly <Check size={14} strokeWidth={2.5} aria-hidden />
        </span>
      );
    case "wheelchair_limited":
      return <span>Limited wheelchair access</span>;
    case "wheelchair_no":
      return (
        <span>
          Not wheelchair accessible{" "}
          <X size={14} strokeWidth={2.5} aria-hidden />
        </span>
      );
    case "dogs_welcome":
      return (
        <span>
          Dogs welcome <Check size={14} strokeWidth={2.5} aria-hidden />
        </span>
      );
    case "no_dogs":
      return (
        <span>
          No dogs <X size={14} strokeWidth={2.5} aria-hidden />
        </span>
      );
    default:
      return null;
  }
}

export function OsmPoiPinSubtitleContent({
  subtitle,
}: {
  subtitle: OsmPoiPinSubtitle;
}) {
  return (
    <>
      {subtitle.parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? " · " : null}
          <OsmPoiSubtitlePartView part={part} />
        </Fragment>
      ))}
    </>
  );
}
