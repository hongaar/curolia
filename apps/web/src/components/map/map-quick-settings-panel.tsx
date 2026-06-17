import { MapVisibilityMenu } from "@/components/map/map-visibility-controls";
import { PrivateProfilePublicMapWarning } from "@/components/profile/private-profile-public-map-warning";
import { useNavigateToMapSettings } from "@/hooks/use-navigate-to-map-settings";
import { removeMapCover, setMapCoverFromFile } from "@/lib/map-cover";
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
import type { MapRoute } from "@/lib/map-route";
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
import type { CuroliaMap, Profile } from "@/types/database";
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
  PageAvatarActions,
  PageErrorText,
  PageFormBlockSpaced,
  PageInlineActions,
} from "@curolia/ui/page";
import { Textarea } from "@curolia/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import styles from "./map-quick-settings-panel.module.css";

const MAX_MAP_DESCRIPTION_LENGTH = 500;

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

export function MapQuickSettingsPanel({
  map,
  mapRoute,
  onClose,
}: {
  map: CuroliaMap;
  mapRoute: MapRoute;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const { refetch: refetchMaps } = useMap();
  const navigateToMapSettings = useNavigateToMapSettings();
  const qc = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(map.name);
  const [iconEmoji, setIconEmoji] = useState(
    map.icon_emoji ?? defaultMapIcon(),
  );
  const [description, setDescription] = useState(map.description ?? "");
  const [coverUrl, setCoverUrl] = useState(map.cover_url ?? "");
  const [mapStyle, setMapStyle] = useState<MapStylePreset>(
    normalizeMapStylePreset(map.style),
  );
  const [styleOptions, setStyleOptions] = useState<MapStyleOptions>(
    normalizeMapStyleOptions(map),
  );
  const [isPublic, setIsPublic] = useState(map.is_public);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerProfileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("is_public")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      return data as Pick<Profile, "is_public"> | null;
    },
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset fields when switching map
    setName(map.name);
    setIconEmoji(map.icon_emoji ?? defaultMapIcon());
    setDescription(map.description ?? "");
    setCoverUrl(map.cover_url ?? "");
    setMapStyle(normalizeMapStylePreset(map.style));
    setStyleOptions(normalizeMapStyleOptions(map));
    setIsPublic(map.is_public);
  }, [map]);

  const savedStyleOptions = normalizeMapStyleOptions(map);
  const nameDirty = name.trim() !== map.name;
  const iconDirty =
    normalizeMapIconForPersist(iconEmoji) !== (map.icon_emoji ?? null);
  const descriptionDirty =
    description.trim() !== (map.description ?? "").trim();
  const styleDirty =
    mapStyle !== normalizeMapStylePreset(map.style) ||
    styleOptions.hillshades !== savedStyleOptions.hillshades ||
    styleOptions.satelliteLabels !== savedStyleOptions.satelliteLabels;
  const canSave =
    Boolean(name.trim()) &&
    (nameDirty || iconDirty || descriptionDirty || styleDirty) &&
    !saving;

  async function uploadCover(file: File) {
    setCoverUploading(true);
    try {
      const publicUrl = await setMapCoverFromFile(map.id, file);
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
    setCoverUploading(true);
    try {
      await removeMapCover(map.id);
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
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const trimmedName = name.trim();
    const nameChanged = trimmedName !== map.name;
    const { error: saveError } = await supabase
      .from("maps")
      .update({
        name: trimmedName,
        ...(nameChanged ? { slug: "" } : {}),
        icon_emoji: normalizeMapIconForPersist(iconEmoji),
        style: mapStyle,
        style_hillshades: styleOptions.hillshades,
        style_satellite_labels: styleOptions.satelliteLabels,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", map.id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      toast.error(saveError.message);
      return;
    }
    toast.success("Map settings saved");
    if (user) {
      await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      if (nameChanged) {
        await refetchMaps();
      }
    }
  }

  const ownerProfileIsPrivate = ownerProfileQuery.data?.is_public === false;

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <PageFormBlockSpaced>
          {error ? <PageErrorText>{error}</PageErrorText> : null}
          <Field>
            <EntityLabelInput
              id="map-quick-name"
              label="Map"
              name={name}
              onNameChange={setName}
              placeholder="Map name"
              emoji={iconEmoji}
              onEmojiChange={setIconEmoji}
              emojiFallback={defaultMapIcon()}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="map-quick-description">Description</FieldLabel>
            <FieldControl>
              <Textarea
                id="map-quick-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short intro for your public profile map card"
                maxLength={MAX_MAP_DESCRIPTION_LENGTH}
                rows={3}
              />
            </FieldControl>
            <FieldDescription>
              Optional. Shown on your public profile when this map is visible
              there.
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
              disabled={coverUploading}
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
                  disabled={coverUploading}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverUploading ? "Working…" : "Upload cover"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={coverUploading || !coverUrl.trim()}
                  onClick={() => void removeCover()}
                >
                  Remove cover
                </Button>
              </PageInlineActions>
            </PageAvatarActions>
          </Field>
          <Field>
            <FieldLabel id="map-quick-style-label">Map style</FieldLabel>
            <ChoiceCards<MapStylePreset>
              name="map-quick-style"
              value={mapStyle}
              onValueChange={setMapStyle}
              aria-labelledby="map-quick-style-label"
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
                    disabled={mapStyle !== "street"}
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
                    disabled={mapStyle !== "satellite"}
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
            <div className={styles.visibilityRow}>
              <span className={styles.visibilityLabel}>Visibility</span>
              <MapVisibilityMenu
                map={{ id: map.id, is_public: isPublic, slug: map.slug }}
                onMapChange={setIsPublic}
              />
            </div>
            {isPublic && ownerProfileIsPrivate ? (
              <PrivateProfilePublicMapWarning context="map-public-access" />
            ) : null}
          </Field>
        </PageFormBlockSpaced>
      </div>
      <div className={styles.footer}>
        <Button type="button" disabled={!canSave} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onClose?.();
            navigateToMapSettings(mapRoute);
          }}
        >
          All settings
        </Button>
      </div>
    </div>
  );
}
