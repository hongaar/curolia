"use client";

import { Check, X } from "lucide-react";
import { Fragment } from "react";

import { PinPlaceMetadataStatus } from "../pin-place-metadata/pin-place-metadata";

export type PinMetadataSubtitlePart =
  | { kind: "text"; text: string }
  | { kind: "wheelchair_friendly" }
  | { kind: "wheelchair_limited" }
  | { kind: "wheelchair_no" }
  | { kind: "dogs_welcome" }
  | { kind: "no_dogs" };

export type PinMetadataSubtitle = {
  parts: PinMetadataSubtitlePart[];
};

function PinMetadataSubtitlePartView({
  part,
}: {
  part: PinMetadataSubtitlePart;
}) {
  switch (part.kind) {
    case "text":
      return <span>{part.text}</span>;
    case "wheelchair_friendly":
      return (
        <PinPlaceMetadataStatus>
          Wheelchair friendly <Check size={14} strokeWidth={2.5} aria-hidden />
        </PinPlaceMetadataStatus>
      );
    case "wheelchair_limited":
      return <span>Limited wheelchair access</span>;
    case "wheelchair_no":
      return (
        <PinPlaceMetadataStatus>
          Wheelchair inaccessible <X size={14} strokeWidth={2.5} aria-hidden />
        </PinPlaceMetadataStatus>
      );
    case "dogs_welcome":
      return (
        <PinPlaceMetadataStatus>
          Dogs welcome <Check size={14} strokeWidth={2.5} aria-hidden />
        </PinPlaceMetadataStatus>
      );
    case "no_dogs":
      return (
        <PinPlaceMetadataStatus>
          Dogs unwelcome <X size={14} strokeWidth={2.5} aria-hidden />
        </PinPlaceMetadataStatus>
      );
    default:
      return null;
  }
}

export function PinMetadataSubtitleContent({
  subtitle,
}: {
  subtitle: PinMetadataSubtitle;
}) {
  return (
    <>
      {subtitle.parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? " · " : null}
          <PinMetadataSubtitlePartView part={part} />
        </Fragment>
      ))}
    </>
  );
}
