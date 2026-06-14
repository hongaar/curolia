import { pinDetailHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import {
  hasPinTravelSequence,
  orderedPinTravelSequence,
  pinSequenceDisplayTitle,
  pinSequenceNeighbors,
  toPinSequenceNavItems,
  toTripTimelineItems,
} from "@/lib/pin-sequence";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { PinSequenceNavCompact } from "@curolia/ui/pin-sequence-nav";
import { TripTimeline } from "@curolia/ui/trip-timeline";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function usePinSequenceNavigation({
  pinId,
  mapPins,
  mapRoute,
  onNavigatePin,
}: {
  pinId: string;
  mapPins: PinWithTags[];
  mapRoute: MapRoute | null;
  onNavigatePin?: (pin: PinWithTags) => void;
}) {
  const navigate = useNavigate();
  const sequence = useMemo(() => orderedPinTravelSequence(mapPins), [mapPins]);
  const neighbors = useMemo(
    () => pinSequenceNeighbors(sequence, pinId),
    [sequence, pinId],
  );
  const items = useMemo(() => toPinSequenceNavItems(sequence), [sequence]);
  const timelineItems = useMemo(
    () => toTripTimelineItems(sequence),
    [sequence],
  );

  const goToPin = (pin: PinWithTags) => {
    if (onNavigatePin) {
      onNavigatePin(pin);
      return;
    }
    if (mapRoute) {
      navigate(pinDetailHref(mapRoute, pin.slug));
    }
  };

  const buildEndpoint = (pin: PinWithTags | null) => {
    if (!pin) return null;
    const title = pinSequenceDisplayTitle(pin);
    if (onNavigatePin) {
      return { title, onClick: () => goToPin(pin) };
    }
    if (!mapRoute) return null;
    return {
      title,
      href: pinDetailHref(mapRoute, pin.slug),
    };
  };

  return {
    sequence,
    neighbors,
    items,
    timelineItems,
    previous: neighbors ? buildEndpoint(neighbors.previous) : null,
    next: neighbors ? buildEndpoint(neighbors.next) : null,
    goToPin,
    visible: hasPinTravelSequence(mapPins) && neighbors != null,
  };
}

export function PinSequenceCompactNavSection({
  pinId,
  mapPins,
  mapRoute,
  onNavigatePin,
}: {
  pinId: string;
  mapPins: PinWithTags[];
  mapRoute: MapRoute | null;
  onNavigatePin?: (pin: PinWithTags) => void;
}) {
  const { previous, next, visible } = usePinSequenceNavigation({
    pinId,
    mapPins,
    mapRoute,
    onNavigatePin,
  });

  if (!visible) return null;

  return <PinSequenceNavCompact previous={previous} next={next} />;
}

export function PinTripTimelineSection({
  pinId,
  mapPins,
  mapRoute,
  onNavigatePin,
}: {
  pinId: string;
  mapPins: PinWithTags[];
  mapRoute: MapRoute | null;
  onNavigatePin?: (pin: PinWithTags) => void;
}) {
  const { timelineItems, sequence, visible, goToPin } =
    usePinSequenceNavigation({
      pinId,
      mapPins,
      mapRoute,
      onNavigatePin,
    });

  if (!visible) return null;

  return (
    <TripTimeline
      items={timelineItems}
      currentId={pinId}
      onSelect={(id) => {
        const target = sequence.find((pin) => pin.id === id);
        if (target) goToPin(target);
      }}
    />
  );
}

/** @deprecated Use `PinSequenceCompactNavSection` and `PinTripTimelineSection`. */
export function PinSequenceNavSection({
  pinId,
  mapPins,
  mapRoute,
  onNavigatePin,
  showDots: _showDots = true,
}: {
  pinId: string;
  mapPins: PinWithTags[];
  mapRoute: MapRoute | null;
  onNavigatePin?: (pin: PinWithTags) => void;
  showDots?: boolean;
}) {
  return (
    <>
      <PinSequenceCompactNavSection
        pinId={pinId}
        mapPins={mapPins}
        mapRoute={mapRoute}
        onNavigatePin={onNavigatePin}
      />
      <PinTripTimelineSection
        pinId={pinId}
        mapPins={mapPins}
        mapRoute={mapRoute}
        onNavigatePin={onNavigatePin}
      />
    </>
  );
}
