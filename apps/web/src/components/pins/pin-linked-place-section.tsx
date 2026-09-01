import { placesGetPlace } from "@/lib/explore-edge";
import { supabase } from "@/lib/supabase";
import {
  PlaceDetailFactList,
  PlaceDetailSection,
} from "@curolia/ui/place-detail";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function PinLinkedPlaceSection({ placeId }: { placeId: string }) {
  const placeQuery = useQuery({
    queryKey: ["linked-place", placeId],
    queryFn: async () => {
      const res = await placesGetPlace(supabase, placeId);
      if ("error" in res) throw new Error(res.error);
      return res.place;
    },
  });

  const place = placeQuery.data;
  if (!place) return null;

  const metadata = place.metadata ?? {};
  const extract = metadata.wikipedia_extract as { value?: string } | undefined;
  const pinCount = place.pinCount ?? 0;

  const facts: { label: string; value: ReactNode }[] = [];
  if (place.subtitle) facts.push({ label: "Type", value: place.subtitle });
  if (pinCount > 0) {
    facts.push({
      label: "Saved by",
      value: `${pinCount} traveler${pinCount === 1 ? "" : "s"}`,
    });
  }

  return (
    <>
      {facts.length > 0 ? (
        <PlaceDetailSection title="From this place">
          <PlaceDetailFactList items={facts} />
        </PlaceDetailSection>
      ) : null}
      {extract?.value ? (
        <PlaceDetailSection title="Wikipedia">
          <p>{extract.value}</p>
        </PlaceDetailSection>
      ) : null}
    </>
  );
}
