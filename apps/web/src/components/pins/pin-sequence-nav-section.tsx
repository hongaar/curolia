import { pinDetailHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import {
  hasPinTravelSequence,
  orderedPinTravelSequence,
  pinSequenceDisplayTitle,
  pinSequenceNeighbors,
  toPinSequenceNavItems,
} from "@/lib/pin-sequence";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { PinSequenceNav } from "@curolia/ui/pin-sequence-nav";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function PinSequenceNavSection({
  pinId,
  mapPins,
  mapRoute,
  onNavigatePin,
  showDots = true,
}: {
  pinId: string;
  mapPins: PinWithTags[];
  mapRoute: MapRoute | null;
  /** Map side sheet: select another pin in place. */
  onNavigatePin?: (pin: PinWithTags) => void;
  showDots?: boolean;
}) {
  const navigate = useNavigate();
  const sequence = useMemo(() => orderedPinTravelSequence(mapPins), [mapPins]);
  const neighbors = useMemo(
    () => pinSequenceNeighbors(sequence, pinId),
    [sequence, pinId],
  );
  const items = useMemo(() => toPinSequenceNavItems(sequence), [sequence]);

  if (!hasPinTravelSequence(mapPins) || !neighbors) return null;

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

  return (
    <PinSequenceNav
      items={items}
      currentIndex={neighbors.index}
      showDots={showDots}
      onSelectIndex={(index) => {
        const target = sequence[index];
        if (target) goToPin(target);
      }}
      previous={buildEndpoint(neighbors.previous)}
      next={buildEndpoint(neighbors.next)}
    />
  );
}
