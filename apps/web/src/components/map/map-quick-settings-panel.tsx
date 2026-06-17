import { MapCoverPinPhotoPicker } from "@/components/map/map-cover-pin-photo-picker";
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
import { PageAvatarActions, PageInlineActions } from "@curolia/ui/page";
import { Textarea } from "@curolia/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@curolia/ui/lib/utils";

import styles from "./map-quick-settings-panel.module.css";

const MAX_MAP_DESCRIPTION_LENGTH = 500;
const SAVED_STATUS_MS = 2000;
const SAVED_FADE_MS = 280;

type SaveStatus = "idle" | "saving" | "saved" | "error";

function MapQuickSettingsFooterStatus({
  saveStatus,
  saveError,
}: {
  saveStatus: SaveStatus;
  saveError: string | null;
}) {
  const showHint = saveStatus === "idle";
  const showSaving = saveStatus === "saving";
  const showSuccess = saveStatus === "saved";
  const showError = saveStatus === "error";

  return (
    <div className={styles.statusSlot} aria-live="polite">
      <p
        className={cn(
          styles.statusLayer,
          showHint ? styles.statusLayerVisible : styles.statusLayerHidden,
        )}
      >
        Settings save automatically
      </p>
      <p
        className={cn(
          styles.statusLayer,
          showSaving ? styles.statusLayerVisible : styles.statusLayerHidden,
        )}
      >
        <Loader2 className={styles.statusIconSpin} aria-hidden />
        Saving…
      </p>
      <p
        className={cn(
          styles.statusLayer,
          styles.statusSuccess,
          showSuccess ? styles.statusLayerVisible : styles.statusLayerHidden,
        )}
      >
        <Check className={styles.statusIcon} aria-hidden />
        Saved
      </p>
      <p
        className={cn(
          styles.statusLayer,
          styles.statusError,
          showError ? styles.statusLayerVisible : styles.statusLayerHidden,
        )}
      >
        {saveError ?? "Could not save settings"}
      </p>
    </div>
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

export function MapQuickSettingsPanel({
  map,
  mapRoute,
  onClose,
  onStylePreviewChange,
}: {
  map: CuroliaMap;
  mapRoute: MapRoute;
  onClose?: () => void;
  onStylePreviewChange?: (style: {
    preset: MapStylePreset;
    options: MapStyleOptions;
  }) => void;
}) {
  const { user } = useAuth();
  const { refetch: refetchMaps } = useMap();
  const navigateToMapSettings = useNavigateToMapSettings();
  const qc = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const mapRef = useRef(map);
  const syncedMapIdRef = useRef(map.id);

  const [name, setName] = useState(map.name);
  const [iconEmoji, setIconEmoji] = useState(
    map.icon_emoji ?? defaultMapIcon(),
  );
  const [description, setDescription] = useState(map.description ?? "");
  const [coverUrl, setCoverUrl] = useState(map.cover_url ?? "");
  const [coverPhotoId, setCoverPhotoId] = useState(map.cover_photo_id ?? null);
  const [mapStyle, setMapStyle] = useState<MapStylePreset>(
    normalizeMapStylePreset(map.style),
  );
  const [styleOptions, setStyleOptions] = useState<MapStyleOptions>(
    normalizeMapStyleOptions(map),
  );
  const [isPublic, setIsPublic] = useState(map.is_public);
  const [coverUploading, setCoverUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

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
    mapRef.current = map;
    const switchedMap = syncedMapIdRef.current !== map.id;
    if (switchedMap) {
      syncedMapIdRef.current = map.id;
      setSaveStatus("idle");
      setSaveError(null);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync fields from server
    setName(map.name);
    setIconEmoji(map.icon_emoji ?? defaultMapIcon());
    setDescription(map.description ?? "");
    setCoverUrl(map.cover_url ?? "");
    setCoverPhotoId(map.cover_photo_id ?? null);
    setMapStyle(normalizeMapStylePreset(map.style));
    setStyleOptions(normalizeMapStyleOptions(map));
    setIsPublic(map.is_public);
  }, [map]);

  useEffect(() => {
    onStylePreviewChange?.({ preset: mapStyle, options: styleOptions });
  }, [mapStyle, styleOptions, onStylePreviewChange]);

  useEffect(
    () => () => {
      clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const showSaved = useCallback(() => {
    setSaveStatus("saved");
    setSaveError(null);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
    }, SAVED_STATUS_MS + SAVED_FADE_MS);
  }, []);

  const persistMapFields = useCallback(
    async (
      fields: {
        name?: string;
        iconEmoji?: string;
        description?: string;
        mapStyle?: MapStylePreset;
        styleOptions?: MapStyleOptions;
      },
      options?: { textOnly?: boolean },
    ) => {
      const currentMap = mapRef.current;
      const trimmedName = (fields.name ?? name).trim();
      if (!trimmedName) return;

      const nextIcon =
        fields.iconEmoji !== undefined
          ? normalizeMapIconForPersist(fields.iconEmoji)
          : normalizeMapIconForPersist(iconEmoji);
      const nextDescription =
        fields.description !== undefined
          ? fields.description.trim() || null
          : description.trim() || null;
      const nextStyle = fields.mapStyle ?? mapStyle;
      const nextStyleOptions = fields.styleOptions ?? styleOptions;

      const textDirtyNow =
        trimmedName !== currentMap.name ||
        nextIcon !== (currentMap.icon_emoji ?? null) ||
        nextDescription !== (currentMap.description ?? null);
      const savedStyleOptions = normalizeMapStyleOptions(currentMap);
      const styleDirtyNow =
        nextStyle !== normalizeMapStylePreset(currentMap.style) ||
        nextStyleOptions.hillshades !== savedStyleOptions.hillshades ||
        nextStyleOptions.satelliteLabels !== savedStyleOptions.satelliteLabels;

      if (options?.textOnly ? !textDirtyNow : !textDirtyNow && !styleDirtyNow) {
        return;
      }

      setSaveStatus("saving");
      setSaveError(null);

      const { error } = await supabase
        .from("maps")
        .update({
          name: trimmedName,
          icon_emoji: nextIcon,
          style: nextStyle,
          style_hillshades: nextStyleOptions.hillshades,
          style_satellite_labels: nextStyleOptions.satelliteLabels,
          description: nextDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentMap.id);

      if (error) {
        setSaveStatus("error");
        setSaveError(error.message);
        return;
      }

      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
        if (trimmedName !== currentMap.name) {
          await refetchMaps();
        }
      }
      showSaved();
    },
    [
      description,
      iconEmoji,
      mapStyle,
      name,
      qc,
      refetchMaps,
      showSaved,
      styleOptions,
      user,
    ],
  );

  const saveTextFieldsIfDirty = useCallback(() => {
    void persistMapFields({}, { textOnly: true });
  }, [persistMapFields]);

  const savedStyleOptions = normalizeMapStyleOptions(map);
  const styleDirty =
    mapStyle !== normalizeMapStylePreset(map.style) ||
    styleOptions.hillshades !== savedStyleOptions.hillshades ||
    styleOptions.satelliteLabels !== savedStyleOptions.satelliteLabels;

  useEffect(() => {
    if (!styleDirty) return;
    void persistMapFields({
      mapStyle,
      styleOptions,
    });
  }, [mapStyle, styleOptions, styleDirty, persistMapFields]);

  async function uploadCover(file: File) {
    setCoverUploading(true);
    setSaveStatus("saving");
    try {
      const publicUrl = await setMapCoverFromFile(map.id, file);
      setCoverUrl(publicUrl);
      setCoverPhotoId(null);
      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      }
      if (coverInputRef.current) coverInputRef.current.value = "";
      showSaved();
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Could not upload cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function removeCover() {
    setCoverUploading(true);
    setSaveStatus("saving");
    try {
      await removeMapCover(map.id);
      setCoverUrl("");
      setCoverPhotoId(null);
      if (user) {
        await qc.invalidateQueries({ queryKey: ["maps", user.id] });
      }
      showSaved();
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "Could not remove cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  const ownerProfileIsPrivate = ownerProfileQuery.data?.is_public === false;

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <div className={styles.form}>
          <Field>
            <EntityLabelInput
              id="map-quick-name"
              label="Map"
              name={name}
              onNameChange={setName}
              onNameBlur={saveTextFieldsIfDirty}
              placeholder="Map name"
              emoji={iconEmoji}
              onEmojiChange={(next) => {
                setIconEmoji(next);
                void persistMapFields({ iconEmoji: next }, { textOnly: true });
              }}
              emojiFallback={defaultMapIcon()}
            />
          </Field>
          <Field>
            <div className={styles.visibilityRow}>
              <span className={styles.visibilityLabel}>Visibility</span>
              <MapVisibilityMenu
                map={{ id: map.id, is_public: isPublic, slug: map.slug }}
                silent
                onMapChange={(next) => {
                  setIsPublic(next);
                  showSaved();
                }}
              />
            </div>
            {isPublic && ownerProfileIsPrivate ? (
              <PrivateProfilePublicMapWarning context="map-public-access" />
            ) : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="map-quick-description">Description</FieldLabel>
            <FieldControl>
              <Textarea
                id="map-quick-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveTextFieldsIfDirty}
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
                <MapCoverPinPhotoPicker
                  mapId={map.id}
                  coverPhotoId={coverPhotoId}
                  disabled={coverUploading}
                  onWorkingChange={setCoverUploading}
                  onCoverSet={({ url, photoId }) => {
                    setCoverUrl(url);
                    setCoverPhotoId(photoId);
                    showSaved();
                  }}
                  onError={(message) => {
                    setSaveStatus("error");
                    setSaveError(message);
                  }}
                />
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
        </div>
      </div>
      <div className={styles.footer}>
        <MapQuickSettingsFooterStatus
          saveStatus={saveStatus}
          saveError={saveError}
        />
        <Button
          type="button"
          variant="outline"
          className={styles.footerButton}
          onClick={() => {
            saveTextFieldsIfDirty();
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
