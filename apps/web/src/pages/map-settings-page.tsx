import { PageBackButton } from "@/components/layout/page-back-button";
import { MapPluginsSection } from "@/components/map-collection/map-plugins-section";
import { MapSharingSection } from "@/components/map-collection/map-sharing-section";
import { EmojiPicker } from "@/components/pins/emoji-picker";
import { mapViewHref } from "@/lib/app-paths";
import {
  defaultMapIcon,
  normalizeMapIconForPersist,
} from "@/lib/map-display-icon";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import { FormField } from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
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

export function MapSettingsPage() {
  const { mapId } = useParams<{ mapId: string }>();
  const { user } = useAuth();
  const { maps, activeMapId, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [iconEmoji, setIconEmoji] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const map = useMemo(
    () => maps.find((j) => j.id === mapId) ?? null,
    [maps, mapId],
  );

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
    setIconEmoji(map.icon_emoji ?? defaultMapIcon(map.is_personal));
  }, [map]);

  async function save() {
    if (!mapId || !map || !name.trim()) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("maps")
      .update({
        name: name.trim(),
        icon_emoji: normalizeMapIconForPersist(iconEmoji, map.is_personal),
        updated_at: new Date().toISOString(),
      })
      .eq("id", mapId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (user) await qc.invalidateQueries({ queryKey: ["maps", user.id] });
  }

  if (!mapId) {
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
  const iconToSave = normalizeMapIconForPersist(iconEmoji, map.is_personal);
  const iconDirty = iconToSave !== (map.icon_emoji ?? null);
  const canSave =
    isOwner && Boolean(name.trim()) && (nameDirty || iconDirty) && !saving;

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Map settings</PageDisplayTitle>
        <PageLead>More options will land here later.</PageLead>

        <PageFormBlockSpaced>
          {!isOwner && !roleQuery.isLoading ? (
            <PageMuted>Only owners can change the map name or icon.</PageMuted>
          ) : null}
          <FormField>
            <Label htmlFor="jn-name">Map name</Label>
            <Input
              id="jn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner || roleQuery.isLoading}
            />
          </FormField>
          <EmojiPicker
            id="jn-settings-icon"
            label="Icon"
            value={iconEmoji}
            onChange={setIconEmoji}
            disabled={!isOwner || roleQuery.isLoading}
          />
          {error ? <PageErrorText>{error}</PageErrorText> : null}
          <PageInlineActions>
            <Button disabled={!canSave} onClick={() => void save()}>
              Save
            </Button>
            {activeMapId !== mapId ? (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setActiveMapId(mapId);
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
        mapId={mapId}
        isOwner={isOwner}
        roleLoading={roleQuery.isLoading}
      />

      <PagePanel>
        <MapSharingSection mapId={mapId} mapName={map.name} isOwner={isOwner} />
      </PagePanel>
    </AppPageLayout>
  );
}
