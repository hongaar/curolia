import { PageBackButton } from "@/components/layout/page-back-button";
import { MapPluginsSection } from "@/components/map-collection/map-plugins-section";
import { MapSharingSection } from "@/components/map-collection/map-sharing-section";
import {
  mapShowMetadataDirty,
  mapShowMetadataForSave,
} from "@/components/map-collection/map-show-metadata";
import { MapShowMetadataField } from "@/components/map-collection/map-show-metadata-section";
import {
  mapSettingsHref,
  mapViewHref,
  resolveMapFromSettingsParam,
} from "@/lib/app-paths";
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
  type MapStyleOptions,
  type MapStylePreset,
} from "@/lib/map-style";
import { MAP_STYLE_PREVIEW_SRC } from "@/lib/map-style-previews";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { resolveMapPinMetadataShow } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Checkbox } from "@curolia/ui/checkbox";
import { ChoiceCard, ChoiceCards } from "@curolia/ui/choice-cards";
import { EntityLabelInput } from "@curolia/ui/entity-label-input";
import { FormField } from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageDisplayTitle,
  PageErrorText,
  PageFormBlockSpaced,
  PageInlineActions,
  PageLead,
  PageMuted,
  PagePanel,
} from "@curolia/ui/page";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export function MapSettingsPage() {
  const { mapSlug: mapSlugParam } = useParams<{ mapSlug: string }>();
  const { user } = useAuth();
  const { maps, activeMapId, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [iconEmoji, setIconEmoji] = useState("");
  const [mapStyle, setMapStyle] = useState<MapStylePreset>("auto");
  const [styleOptions, setStyleOptions] = useState<MapStyleOptions>({
    hillshades: false,
    satelliteLabels: false,
  });
  const [showPinMetadata, setShowPinMetadata] = useState(
    resolveMapPinMetadataShow(null),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const map = useMemo(
    () => resolveMapFromSettingsParam(maps, mapSlugParam),
    [maps, mapSlugParam],
  );
  const mapId = map?.id ?? null;

  useEffect(() => {
    if (!map || !mapSlugParam) return;
    const canonicalSlug = map.slug.trim();
    if (!canonicalSlug || mapSlugParam === canonicalSlug) return;
    navigate(mapSettingsHref(canonicalSlug), { replace: true });
  }, [map, mapSlugParam, navigate]);

  const roleQuery = useQuery({
    queryKey: ["map_member_role", mapId, user?.id],
    queryFn: async () => {
      if (!mapId || !user) return null;
      const { data, error: err } = await supabase
        .from("map_members")
        .select("role")
        .eq("map_id", mapId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (err) throw err;
      return data?.role ?? null;
    },
    enabled: Boolean(mapId && user),
  });

  const isOwner = roleQuery.data === "owner";

  useEffect(() => {
    if (!map) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset field when switching map
    setName(map.name);
    setIconEmoji(map.icon_emoji ?? defaultMapIcon());
    setMapStyle(normalizeMapStylePreset(map.style));
    setStyleOptions(normalizeMapStyleOptions(map));
    setShowPinMetadata(resolveMapPinMetadataShow(map.show_pin_metadata));
  }, [map]);

  async function save() {
    if (!mapId || !map || !name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("maps")
      .update({
        name: name.trim(),
        icon_emoji: normalizeMapIconForPersist(iconEmoji),
        style: mapStyle,
        style_hillshades: styleOptions.hillshades,
        style_satellite_labels: styleOptions.satelliteLabels,
        show_pin_metadata: mapShowMetadataForSave(showPinMetadata),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mapId);
    setSaving(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success("Map settings saved");
    if (user) {
      await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      await qc.invalidateQueries({
        queryKey: ["maps", mapId, "show_pin_metadata"],
      });
    }
  }

  if (!mapSlugParam) {
    return <PageCenteredLoading>Missing map.</PageCenteredLoading>;
  }

  if (!map) {
    return (
      <AppPageLayout>
        <PageBackButton />
        <PagePanel>
          <PageMuted>
            You do not have access to this map or it does not exist.
          </PageMuted>
          <PageInlineActions spaced="tight">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  to={maps[0]?.slug ? mapViewHref("map", maps[0].slug) : "/"}
                />
              }
            >
              Back to map
            </Button>
          </PageInlineActions>
        </PagePanel>
      </AppPageLayout>
    );
  }

  const nameDirty = name.trim() !== map.name;
  const iconToSave = normalizeMapIconForPersist(iconEmoji);
  const iconDirty = iconToSave !== (map.icon_emoji ?? null);
  const savedStyleOptions = normalizeMapStyleOptions(map);
  const styleDirty =
    mapStyle !== normalizeMapStylePreset(map.style) ||
    styleOptions.hillshades !== savedStyleOptions.hillshades ||
    styleOptions.satelliteLabels !== savedStyleOptions.satelliteLabels;
  const metadataDirty = mapShowMetadataDirty(map, showPinMetadata);
  const controlsDisabled = !isOwner || roleQuery.isLoading;

  const canSave =
    isOwner &&
    Boolean(name.trim()) &&
    (nameDirty || iconDirty || styleDirty || metadataDirty) &&
    !saving;

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Map settings</PageDisplayTitle>
        <PageLead>More options will land here later.</PageLead>

        <PageFormBlockSpaced>
          {!isOwner && !roleQuery.isLoading ? (
            <PageMuted>Only owners can change map settings.</PageMuted>
          ) : null}
          <FormField>
            <EntityLabelInput
              id="jn-name"
              label="Map"
              name={name}
              onNameChange={setName}
              placeholder="Map name"
              disabled={!isOwner || roleQuery.isLoading}
              emoji={iconEmoji}
              onEmojiChange={setIconEmoji}
              emojiFallback={defaultMapIcon()}
            />
          </FormField>
          <FormField>
            <Label id="map-style-label">Map style</Label>
            <ChoiceCards<MapStylePreset>
              name="map-style"
              value={mapStyle}
              onValueChange={setMapStyle}
              disabled={controlsDisabled}
              aria-labelledby="map-style-label"
            >
              <ChoiceCard
                value="auto"
                label="Auto"
                description="Light or dark"
                previewSrc={MAP_STYLE_PREVIEW_SRC.auto}
              />
              <ChoiceCard
                value="street"
                label="Street"
                description="Detailed streets"
                previewSrc={MAP_STYLE_PREVIEW_SRC.street}
                footer={
                  <MapStyleOptionCheckbox
                    id="map-style-hillshades"
                    label="Terrain"
                    checked={styleOptions.hillshades}
                    disabled={controlsDisabled || mapStyle !== "street"}
                    onCheckedChange={(checked) =>
                      setStyleOptions((prev) => ({
                        ...prev,
                        hillshades: checked,
                      }))
                    }
                  />
                }
              />
              <ChoiceCard
                value="satellite"
                label="Satellite"
                description="Aerial imagery"
                previewSrc={MAP_STYLE_PREVIEW_SRC.satellite}
                footer={
                  <MapStyleOptionCheckbox
                    id="map-style-satellite-labels"
                    label="Labels"
                    checked={styleOptions.satelliteLabels}
                    disabled={controlsDisabled || mapStyle !== "satellite"}
                    onCheckedChange={(checked) =>
                      setStyleOptions((prev) => ({
                        ...prev,
                        satelliteLabels: checked,
                      }))
                    }
                  />
                }
              />
            </ChoiceCards>
          </FormField>
          <MapShowMetadataField
            mapId={map.id}
            settings={showPinMetadata}
            onChange={setShowPinMetadata}
            disabled={controlsDisabled}
          />
          {error ? <PageErrorText>{error}</PageErrorText> : null}
          <PageInlineActions>
            <Button disabled={!canSave} onClick={() => void save()}>
              Save
            </Button>
            {map.slug.trim() ? (
              <Button
                variant="outline"
                type="button"
                render={<Link to={mapViewHref("blog", map.slug.trim())} />}
              >
                View blog
              </Button>
            ) : null}
            {activeMapId !== map.id ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setActiveMapId(map.id);
                  const slug = map.slug.trim();
                  navigate(slug ? mapViewHref("map", slug) : "/");
                }}
              >
                Switch to this map
              </Button>
            ) : null}
          </PageInlineActions>
        </PageFormBlockSpaced>
      </PagePanel>

      <MapPluginsSection
        mapId={map.id}
        isOwner={isOwner}
        roleLoading={roleQuery.isLoading}
      />

      <PagePanel>
        <MapSharingSection
          mapId={map.id}
          mapName={map.name}
          mapSlug={map.slug}
          isPublic={map.is_public}
          isOwner={isOwner}
        />
      </PagePanel>
    </AppPageLayout>
  );
}

function MapStyleOptionCheckbox({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label htmlFor={id}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </Label>
  );
}
