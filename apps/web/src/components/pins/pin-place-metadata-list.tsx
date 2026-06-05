import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { usePinMetadata } from "@/lib/use-pin-metadata";
import {
  pinMetadataWebsiteDisplayLabel,
  type PinMetadataDisplayItem,
} from "@curolia/plugin-contract";
import {
  PinPlaceMetadataAttribution,
  PinPlaceMetadataFactItem,
  PinPlaceMetadataFactList,
  PinPlaceMetadataLink,
  PinPlaceMetadataMultiline,
  PinPlaceMetadataRoot,
  PinPlaceMetadataRow,
  PinPlaceMetadataStatus,
  PinPlaceMetadataText,
  type PinPlaceMetadataFieldKey,
} from "@curolia/ui/pin-place-metadata";
import { Check, X } from "lucide-react";

type PinPlaceMetadataListProps = {
  pinId: string;
};

export function PinPlaceMetadataList({ pinId }: PinPlaceMetadataListProps) {
  const metadataQuery = usePinMetadata(pinId);
  const { plugins } = useEnabledPlugins();
  const items = metadataQuery.data ?? [];
  if (items.length === 0) return null;

  const sourceLabelByPluginId = new Map(
    plugins.map((plugin) => [plugin.id, plugin.displayName]),
  );

  const visibleItems = items.filter(isVisiblePlaceMetadataItem);
  const sourceLabels = [
    ...new Set(
      visibleItems
        .map((item) => sourceLabelByPluginId.get(item.sourcePluginId))
        .filter((label): label is string => Boolean(label)),
    ),
  ];

  return (
    <PinPlaceMetadataRoot
      footer={<PinPlaceMetadataAttribution sources={sourceLabels} />}
    >
      {visibleItems.map((item) => (
        <PinPlaceMetadataItemRow key={item.fieldKey} item={item} />
      ))}
    </PinPlaceMetadataRoot>
  );
}

function isVisiblePlaceMetadataItem(
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
    case "place_facts":
      return (
        <PinPlaceMetadataFactList>
          {item.value.facts.map((fact) => (
            <PinPlaceMetadataFactItem
              key={`${fact.label}-${fact.value}`}
              label={fact.label}
            >
              {fact.value}
            </PinPlaceMetadataFactItem>
          ))}
        </PinPlaceMetadataFactList>
      );
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
      Not wheelchair accessible <X size={14} strokeWidth={2.5} aria-hidden />
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
      No dogs <X size={14} strokeWidth={2.5} aria-hidden />
    </PinPlaceMetadataStatus>
  );
}
