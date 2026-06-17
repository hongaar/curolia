import { PageBackButton } from "@/components/layout/page-back-button";
import { MapPluginsSection } from "@/components/map-collection/map-plugins-section";
import { MapSharingSection } from "@/components/map-collection/map-sharing-section";
import {
  mapShowMetadataDirty,
  mapShowMetadataForSave,
} from "@/components/map-collection/map-show-metadata";
import { MapShowMetadataField } from "@/components/map-collection/map-show-metadata-section";
import { MapViewsSettingsField } from "@/components/map-collection/map-views-settings-field";
import { useActivePageSection } from "@/hooks/use-active-page-section";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { useMinMd } from "@/hooks/use-min-md";
import type { MapWithOwnerSlug } from "@/lib/app-paths";
import {
  mapSettingsHref,
  mapViewHref,
  resolveMapFromSettingsParam,
} from "@/lib/app-paths";
import { removeMapCover, setMapCoverFromFile } from "@/lib/map-cover";
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
import { normalizeShowPinRoute } from "@/lib/map-pin-route";
import { mapRouteForMap } from "@/lib/map-route";
import { MAP_SETTINGS_SECTION } from "@/lib/map-settings-sections";
import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
  type MapStyleOptions,
  type MapStylePreset,
} from "@/lib/map-style";
import { MAP_STYLE_PREVIEW_SRC } from "@/lib/map-style-previews";
import {
  enabledMapViewsForSave,
  mapViewSettingsDirty,
  normalizeMapViewSettings,
  type MapViewSettings,
} from "@/lib/map-view-settings";
import { resolveMapByOwnerSlug } from "@/lib/resolve-map-slug";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { resolveMapPinMetadataShow } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Checkbox } from "@curolia/ui/checkbox";
import { ChoiceCard, ChoiceCards } from "@curolia/ui/choice-cards";
import { EntityLabelInput } from "@curolia/ui/entity-label-input";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  SrOnlyInput,
} from "@curolia/ui/form-layout";
import { Label } from "@curolia/ui/label";
import { MapCoverPreview } from "@curolia/ui/map-card";
import {
  AppPageLayout,
  PageAnchoredSection,
  PageAvatarActions,
  PageCenteredLoading,
  PageErrorText,
  PageFormBlockSpaced,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PageMuted,
  PagePanel,
  PageSideNav,
  PageSideNavGroup,
  PageSideNavGroupTitle,
  PageSideNavItem,
  PageSideNavLayout,
  PageSideNavLink,
  PageSideNavList,
} from "@curolia/ui/page";
import { Textarea } from "@curolia/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const MAX_MAP_DESCRIPTION_LENGTH = 500;

export function MapSettingsPage() {
  const { profileSlug: profileSlugParam, mapSlug: mapSlugParam } = useParams<{
    profileSlug: string;
    mapSlug: string;
  }>();
  const { user } = useAuth();
  const {
    maps,
    memberMaps,
    activeMapId,
    setActiveMapId,
    refetch: refetchMaps,
  } = useMap();
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
  const [showPinRoute, setShowPinRoute] = useState(false);
  const [mapViewSettings, setMapViewSettings] = useState<MapViewSettings>(
    normalizeMapViewSettings(null),
  );
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useMapSlugRouteSync(profileSlugParam, mapSlugParam);

  const mapFromList = useMemo(
    () => resolveMapFromSettingsParam(maps, profileSlugParam, mapSlugParam),
    [maps, profileSlugParam, mapSlugParam],
  );

  const redirectMapQuery = useQuery({
    queryKey: [
      "settings_map_slug",
      profileSlugParam,
      mapSlugParam,
      maps.map((m) => m.id).join(","),
    ],
    queryFn: async () => {
      if (!profileSlugParam?.trim() || !mapSlugParam?.trim()) return null;
      const profile = await resolveProfileBySlug(profileSlugParam);
      if (!profile) return null;
      const resolved = await resolveMapByOwnerSlug(
        profile.profileId,
        mapSlugParam,
      );
      if (!resolved) return null;
      return maps.find((m) => m.id === resolved.mapId) ?? null;
    },
    enabled: Boolean(profileSlugParam && mapSlugParam && !mapFromList),
  });

  const map = mapFromList ?? redirectMapQuery.data ?? null;
  const mapId = map?.id ?? null;
  const isMember = Boolean(
    mapId && memberMaps.some((memberMap) => memberMap.id === mapId),
  );

  useEffect(() => {
    if (!map || isMember) return;
    navigate(mapViewHref("map", mapRouteForMap(map)), { replace: true });
  }, [map, isMember, navigate]);

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
  const isWideEnough = useMinMd();
  const { plugins: enabledPlugins } = useEnabledPlugins({
    queryEnabled: isOwner,
  });

  const coreNavItems = useMemo(
    () => [
      { id: MAP_SETTINGS_SECTION.general, label: "General" },
      { id: MAP_SETTINGS_SECTION.sharing, label: "Sharing" },
    ],
    [],
  );

  const pluginNavItems = useMemo(() => {
    if (!isOwner) return [];
    const items: { id: string; label: string }[] = [];
    for (const plugin of enabledPlugins) {
      if (!plugin.MapSettingsPanel) continue;
      items.push({
        id: MAP_SETTINGS_SECTION.plugin(plugin.id),
        label: plugin.contributions?.mapSettings?.title ?? plugin.displayName,
      });
    }
    return items;
  }, [enabledPlugins, isOwner]);

  const sectionNavItems = useMemo(
    () => [...coreNavItems, ...pluginNavItems],
    [coreNavItems, pluginNavItems],
  );

  const showSideNav = isWideEnough && sectionNavItems.length > 1;
  const sectionIds = useMemo(
    () => sectionNavItems.map((item) => item.id),
    [sectionNavItems],
  );
  const { active: activeSection, setActiveSection } = useActivePageSection(
    sectionIds,
    showSideNav,
  );

  const scrollToSection = useCallback(
    (id: string) => {
      setActiveSection(id);
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [setActiveSection],
  );

  useEffect(() => {
    if (!map) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset field when switching map
    setName(map.name);
    setIconEmoji(map.icon_emoji ?? defaultMapIcon());
    setMapStyle(normalizeMapStylePreset(map.style));
    setStyleOptions(normalizeMapStyleOptions(map));
    setShowPinMetadata(resolveMapPinMetadataShow(map.show_pin_metadata));
    setShowPinRoute(normalizeShowPinRoute(map.show_pin_route));
    setMapViewSettings(normalizeMapViewSettings(map));
    setDescription(map.description ?? "");
    setCoverUrl(map.cover_url ?? "");
  }, [map]);

  async function uploadCover(file: File) {
    if (!mapId || !isOwner) return;
    setCoverUploading(true);
    try {
      const publicUrl = await setMapCoverFromFile(mapId, file);
      setCoverUrl(publicUrl);
      toast.success("Cover photo updated");
      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      }
      if (coverInputRef.current) coverInputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function removeCover() {
    if (!mapId || !isOwner) return;
    setCoverUploading(true);
    try {
      await removeMapCover(mapId);
      setCoverUrl("");
      toast.success("Cover photo removed");
      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function save() {
    if (!mapId || !map || !name.trim()) return;
    setSaving(true);
    setError(null);
    const trimmedName = name.trim();
    const nameChanged = trimmedName !== map.name;
    const { error: err } = await supabase
      .from("maps")
      .update({
        name: trimmedName,
        icon_emoji: normalizeMapIconForPersist(iconEmoji),
        style: mapStyle,
        style_hillshades: styleOptions.hillshades,
        style_satellite_labels: styleOptions.satelliteLabels,
        show_pin_metadata: mapShowMetadataForSave(showPinMetadata),
        show_pin_route: showPinRoute,
        default_map_view: mapViewSettings.defaultView,
        enabled_map_views: enabledMapViewsForSave(mapViewSettings.enabled),
        description: description.trim() || null,
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
      if (nameChanged) {
        await refetchMaps();
        const updatedMaps = qc.getQueryData<MapWithOwnerSlug[]>([
          "maps",
          user.id,
        ]);
        const updated = updatedMaps?.find((m) => m.id === mapId);
        if (updated?.owner_profile_slug && updated.slug) {
          navigate(mapSettingsHref(mapRouteForMap(updated)), { replace: true });
        }
      }
    }
  }

  if (!mapSlugParam || !profileSlugParam) {
    return <PageCenteredLoading>Missing map.</PageCenteredLoading>;
  }

  if (!map) {
    if (redirectMapQuery.isPending && !mapFromList) {
      return <PageCenteredLoading>Loading map…</PageCenteredLoading>;
    }
    return (
      <AppPageLayout toolbar={<PageBackButton />}>
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
                    memberMaps[0]?.owner_profile_slug && memberMaps[0]?.slug
                      ? mapViewHref("map", mapRouteForMap(memberMaps[0]))
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

  if (!isMember) {
    return <PageCenteredLoading>Loading map…</PageCenteredLoading>;
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
  const routeDirty = showPinRoute !== normalizeShowPinRoute(map.show_pin_route);
  const viewsDirty = mapViewSettingsDirty(map, mapViewSettings);
  const descriptionDirty =
    description.trim() !== (map.description ?? "").trim();
  const controlsDisabled = !isOwner || roleQuery.isLoading;

  const canSave =
    isOwner &&
    Boolean(name.trim()) &&
    (nameDirty ||
      iconDirty ||
      styleDirty ||
      metadataDirty ||
      routeDirty ||
      viewsDirty ||
      descriptionDirty) &&
    !saving;

  const sideNav = showSideNav ? (
    <PageSideNav aria-label="Map settings sections">
      <PageSideNavList>
        {coreNavItems.map((item) => (
          <PageSideNavItem key={item.id}>
            <PageSideNavLink
              active={activeSection === item.id}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </PageSideNavLink>
          </PageSideNavItem>
        ))}
      </PageSideNavList>
      {pluginNavItems.length > 0 ? (
        <PageSideNavGroup>
          <PageSideNavGroupTitle>Plugins</PageSideNavGroupTitle>
          <PageSideNavList>
            {pluginNavItems.map((item) => (
              <PageSideNavItem key={item.id}>
                <PageSideNavLink
                  active={activeSection === item.id}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </PageSideNavLink>
              </PageSideNavItem>
            ))}
          </PageSideNavList>
        </PageSideNavGroup>
      ) : null}
    </PageSideNav>
  ) : undefined;

  return (
    <AppPageLayout
      toolbar={showSideNav ? undefined : <PageBackButton />}
      width={showSideNav ? "2xl" : "narrow"}
    >
      <PageSideNavLayout
        nav={sideNav}
        navHeader={showSideNav ? <PageBackButton /> : undefined}
      >
        <PageAnchoredSection id={MAP_SETTINGS_SECTION.general}>
          <PagePanel>
            <PageHeader>
              <PageHeaderTitle>Map settings</PageHeaderTitle>
              <PageHeaderLead>Manage your map settings.</PageHeaderLead>
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
                <FieldLabel htmlFor="map-description">Description</FieldLabel>
                <FieldControl>
                  <Textarea
                    id="map-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A short intro for your public profile map card"
                    disabled={controlsDisabled}
                    maxLength={MAX_MAP_DESCRIPTION_LENGTH}
                    rows={3}
                  />
                </FieldControl>
                <FieldDescription>
                  Optional. Shown on your public profile when this map is
                  visible there.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Cover photo</FieldLabel>
                <FieldControl>
                  <MapCoverPreview
                    coverUrl={coverUrl.trim() || null}
                    iconEmoji={iconEmoji || defaultMapIcon()}
                  />
                </FieldControl>
                <SrOnlyInput
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  aria-label="Upload map cover photo"
                  disabled={coverUploading || controlsDisabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCover(file);
                  }}
                />
                <PageAvatarActions>
                  <PageInlineActions spaced="none">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={coverUploading || controlsDisabled}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverUploading ? "Working…" : "Upload cover"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={
                        coverUploading || controlsDisabled || !coverUrl.trim()
                      }
                      onClick={() => void removeCover()}
                    >
                      Remove cover
                    </Button>
                  </PageInlineActions>
                </PageAvatarActions>
                <FieldDescription>
                  Optional. Shown on your public profile map card.
                </FieldDescription>
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
              <Field>
                <MapViewsSettingsField
                  value={mapViewSettings}
                  onChange={setMapViewSettings}
                  disabled={controlsDisabled}
                />
              </Field>
              <Field>
                <FieldLabel>Route lines</FieldLabel>
                <Label>
                  <Checkbox
                    checked={showPinRoute}
                    disabled={controlsDisabled}
                    onCheckedChange={(value) => setShowPinRoute(value === true)}
                  />
                  Connect dated pins in chronological order on the map
                </Label>
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
        </PageAnchoredSection>

        <PageAnchoredSection id={MAP_SETTINGS_SECTION.sharing}>
          <MapSharingSection
            mapId={map.id}
            mapName={map.name}
            ownerProfileSlug={mapRouteForMap(map).profileSlug}
            mapSlug={map.slug}
            isPublic={map.is_public}
            blockPublicCrawlers={map.block_public_crawlers}
            isOwner={isOwner}
          />
        </PageAnchoredSection>

        <MapPluginsSection
          mapId={map.id}
          isOwner={isOwner}
          roleLoading={roleQuery.isLoading}
          sectionIdForPlugin={
            showSideNav ? MAP_SETTINGS_SECTION.plugin : undefined
          }
        />
      </PageSideNavLayout>
    </AppPageLayout>
  );
}

function MapStyleOptionCheckbox({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </Label>
  );
}
