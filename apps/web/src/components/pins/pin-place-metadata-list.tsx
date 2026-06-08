import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { usePinMetadata } from "@/lib/use-pin-metadata";
import {
  filterPinMetadataForDetailDisplay,
  hasPinMetadataDetailDisplayEnabled,
  pinMetadataWebsiteDisplayLabel,
  resolveMapPinMetadataShow,
  type PinMetadataDisplayItem,
} from "@curolia/plugin-contract";
import { usePoiPinMetadataLoading } from "@curolia/plugin-poi";
import {
  PinPlaceMetadataAttribution,
  PinPlaceMetadataLink,
  PinPlaceMetadataLoading,
  PinPlaceMetadataMultiline,
  PinPlaceMetadataRoot,
  PinPlaceMetadataRow,
  PinPlaceMetadataStatus,
  PinPlaceMetadataText,
  type PinPlaceMetadataFieldKey,
} from "@curolia/ui/pin-place-metadata";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

type PinPlaceMetadataListProps = {
  pinId: string;
  mapId: string;
  lat: number;
  lng: number;
  poiEnabled?: boolean;
};

export function PinPlaceMetadataList({
  pinId,
  mapId,
  lat,
  lng,
  poiEnabled = false,
}: PinPlaceMetadataListProps) {
  const metadataQuery = usePinMetadata(pinId);
  const { plugins } = useEnabledPlugins();
  const items = metadataQuery.data ?? [];

  const showMetadataQuery = useQuery({
    queryKey: ["maps", mapId, "show_pin_metadata"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maps")
        .select("show_pin_metadata")
        .eq("id", mapId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(mapId),
  });

  const showSettings = resolveMapPinMetadataShow(
    showMetadataQuery.data?.show_pin_metadata,
  );
  const visibleItems = filterPinMetadataForDetailDisplay(
    items,
    showSettings,
  ).filter(isRenderablePlaceMetadataItem);

  const poiMetadataLoading = usePoiPinMetadataLoading({
    supabase,
    pinId,
    mapId,
    lat,
    lng,
    queryEnabled: poiEnabled,
  });

  const showPoiLoading =
    poiEnabled &&
    hasPinMetadataDetailDisplayEnabled(showSettings) &&
    poiMetadataLoading;

  if (showPoiLoading) {
    return (
      <PinPlaceMetadataLoading>
        Loading additional information…
      </PinPlaceMetadataLoading>
    );
  }

  if (visibleItems.length === 0) return null;

  const sourceLabelByPluginId = new Map(
    plugins.map((plugin) => [plugin.id, plugin.displayName]),
  );

  const sourceLabels = [
    ...new Set(
      visibleItems
        .map((item) => sourceLabelByPluginId.get(item.sourcePluginId))
        .filter((label): label is string => Boolean(label)),
    ),
  ];

  return (
    <PinPlaceMetadataRoot
      footer={
        sourceLabels.length > 0 ? (
          <PinPlaceMetadataAttribution sources={sourceLabels} />
        ) : null
      }
    >
      {visibleItems.map((item) => (
        <PinPlaceMetadataItemRow key={item.fieldKey} item={item} />
      ))}
    </PinPlaceMetadataRoot>
  );
}

function isRenderablePlaceMetadataItem(
  item: PinMetadataDisplayItem,
): item is VisiblePinMetadataItem {
  return item.fieldKey !== "place_categories";
}

type VisiblePinMetadataItem = PinMetadataDisplayItem & {
  fieldKey: PinPlaceMetadataFieldKey;
};

function PinPlaceMetadataItemRow({ item }: { item: VisiblePinMetadataItem }) {
  return (
    <PinPlaceMetadataRow fieldKey={item.fieldKey}>
      <PinPlaceMetadataValue item={item} />
    </PinPlaceMetadataRow>
  );
}

function PinPlaceMetadataValue({ item }: { item: VisiblePinMetadataItem }) {
  switch (item.fieldKey) {
    case "place_name":
    case "place_type":
    case "cuisine":
    case "brand":
    case "operator":
      return <PinPlaceMetadataText>{item.value.label}</PinPlaceMetadataText>;
    case "dietary_options":
      return (
        <PinPlaceMetadataText>
          {item.value.labels.join(" · ")}
        </PinPlaceMetadataText>
      );
    case "wheelchair_access":
      return <WheelchairAccessValue level={item.value.level} />;
    case "dog_policy":
      return <DogPolicyValue level={item.value.level} />;
    case "opening_hours":
      return (
        <PinPlaceMetadataMultiline>
          {item.value.display}
        </PinPlaceMetadataMultiline>
      );
    case "phone": {
      const display = item.value.display ?? item.value.tel;
      return (
        <PinPlaceMetadataLink href={`tel:${item.value.tel}`}>
          <PinPlaceMetadataText>{display}</PinPlaceMetadataText>
        </PinPlaceMetadataLink>
      );
    }
    case "website":
      return (
        <PinPlaceMetadataLink href={item.value.url}>
          <PinPlaceMetadataText>
            {pinMetadataWebsiteDisplayLabel(item.value)}
          </PinPlaceMetadataText>
        </PinPlaceMetadataLink>
      );
    case "email": {
      const label = item.value.label ?? item.value.email;
      return (
        <PinPlaceMetadataLink href={`mailto:${item.value.email}`}>
          <PinPlaceMetadataText>{label}</PinPlaceMetadataText>
        </PinPlaceMetadataLink>
      );
    }
    default:
      return null;
  }
}

function WheelchairAccessValue({
  level,
}: {
  level: "yes" | "designated" | "limited" | "no";
}) {
  if (level === "yes" || level === "designated") {
    return (
      <PinPlaceMetadataStatus>
        Wheelchair friendly <Check size={14} strokeWidth={2.5} aria-hidden />
      </PinPlaceMetadataStatus>
    );
  }
  if (level === "limited") {
    return (
      <PinPlaceMetadataText>Limited wheelchair access</PinPlaceMetadataText>
    );
  }
  return (
    <PinPlaceMetadataStatus>
      Wheelchair inaccessible <X size={14} strokeWidth={2.5} aria-hidden />
    </PinPlaceMetadataStatus>
  );
}

function DogPolicyValue({ level }: { level: "yes" | "leashed" | "no" }) {
  if (level === "yes" || level === "leashed") {
    return (
      <PinPlaceMetadataStatus>
        Dogs welcome <Check size={14} strokeWidth={2.5} aria-hidden />
      </PinPlaceMetadataStatus>
    );
  }
  return (
    <PinPlaceMetadataStatus>
      Dogs unwelcome <X size={14} strokeWidth={2.5} aria-hidden />
    </PinPlaceMetadataStatus>
  );
}
