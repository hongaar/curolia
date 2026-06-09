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
import { mapRouteForMap } from "@/lib/map-route";
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
import { Field, FieldControl, FieldLabel } from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageErrorText,
  PageFormBlockSpaced,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PageMuted,
  PagePanel,
} from "@curolia/ui/page";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export function MapSettingsPage() {
  const { profileSlug: profileSlugParam, mapSlug: mapSlugParam } = useParams<{
    profileSlug: string;
    mapSlug: string;
  }>();
  const { user } = useAuth();
  const { maps, activeMapId, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [mapSlugInput, setMapSlugInput] = useState("");
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
    () => resolveMapFromSettingsParam(maps, profileSlugParam, mapSlugParam),
    [maps, profileSlugParam, mapSlugParam],
  );
  const mapId = map?.id ?? null;

  useEffect(() => {
    if (!map || !mapSlugParam || !profileSlugParam) return;
    const route = mapRouteForMap(map);
    if (
      route.profileSlug === profileSlugParam.trim() &&
      route.mapSlug === mapSlugParam.trim()
    ) {
      return;
    }
    navigate(mapSettingsHref(route), { replace: true });
  }, [map, mapSlugParam, profileSlugParam, navigate]);

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
    setMapSlugInput(map.slug);
    setIconEmoji(map.icon_emoji ?? defaultMapIcon());
    setMapStyle(normalizeMapStylePreset(map.style));
    setStyleOptions(normalizeMapStyleOptions(map));
    setShowPinMetadata(resolveMapPinMetadataShow(map.show_pin_metadata));
  }, [map]);

  async function save() {
    if (!mapId || !map || !name.trim()) return;
    setSaving(true);
    setError(null);
    const nextSlug = mapSlugInput.trim();
    const { error: err } = await supabase
      .from("maps")
      .update({
        name: name.trim(),
        slug: nextSlug !== map.slug.trim() ? nextSlug : map.slug,
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

  if (!mapSlugParam || !profileSlugParam) {
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
                  to={
                    maps[0]?.owner_profile_slug && maps[0]?.slug
                      ? mapViewHref("map", mapRouteForMap(maps[0]))
                      : "/"
                  }
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
  const slugDirty = mapSlugInput.trim() !== map.slug.trim();
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
    (nameDirty || slugDirty || iconDirty || styleDirty || metadataDirty) &&
    !saving;

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageHeader>
          <PageHeaderTitle>Map settings</PageHeaderTitle>
          <PageHeaderLead>More options will land here later.</PageHeaderLead>
        </PageHeader>

        <PageFormBlockSpaced>
          {!isOwner && !roleQuery.isLoading ? (
            <PageMuted>Only owners can change map settings.</PageMuted>
          ) : null}
          <Field>
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
          </Field>
          <Field>
            <FieldLabel htmlFor="map-url-slug">URL slug</FieldLabel>
            <FieldControl>
              <Input
                id="map-url-slug"
                value={mapSlugInput}
                onChange={(e) => setMapSlugInput(e.target.value)}
                disabled={!isOwner || roleQuery.isLoading}
                autoComplete="off"
              />
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel id="map-style-label">Map style</FieldLabel>
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
          </Field>
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
            {map.owner_profile_slug && map.slug.trim() ? (
              <Button
                variant="outline"
                type="button"
                render={<Link to={mapViewHref("blog", mapRouteForMap(map))} />}
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
                  navigate(
                    map.owner_profile_slug
                      ? mapViewHref("map", mapRouteForMap(map))
                      : "/",
                  );
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
          ownerProfileSlug={mapRouteForMap(map).profileSlug}
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
