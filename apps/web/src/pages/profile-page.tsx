import { PageBackButton } from "@/components/layout/page-back-button";
import { UserAvatar } from "@/components/user-avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { FormField, SrOnlyInput } from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageAvatarActions,
  PageAvatarHint,
  PageAvatarRow,
  PageAvatarSection,
  PageDisplayTitle,
  PageEmailLine,
  PageExternalLink,
  PageFitButton,
  PageInlineActions,
  PageLead,
  PagePanel,
  PageProfileGrid,
} from "@curolia/ui/page";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function extFromImageFile(file: File): string | null {
  return MIME_TO_EXT[file.type] ?? null;
}

function ProfileEditor({
  profile,
  user,
  profileLoading,
}: {
  profile: Profile | null;
  user: User;
  profileLoading: boolean;
}) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(
    () => profile?.display_name ?? "",
  );
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function uploadAvatar(file: File) {
    const ext = extFromImageFile(file);
    if (!ext) {
      toast.error("Please choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }
    setUploading(true);
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
      });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl;
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setUploading(false);
    if (dbError) {
      toast.error(dbError.message);
      return;
    }
    setAvatarUrl(publicUrl);
    toast.success("Photo updated");
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeAvatar() {
    setUploading(true);
    const { data: files } = await supabase.storage
      .from("avatars")
      .list(user.id);
    if (files?.length) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from("avatars").remove(paths);
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAvatarUrl("");
    toast.success("Photo removed");
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  return (
    <PageProfileGrid>
      <PageAvatarSection>
        <Label>Photo</Label>
        <PageAvatarRow>
          <UserAvatar
            storedAvatarUrl={avatarUrl}
            email={user.email}
            gravatarFallback={!profileLoading}
            gravatarSize={256}
            size="lg"
            label={displayName.trim() || user.email || "Profile"}
          />
          <SrOnlyInput
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            aria-label="Upload profile photo"
            disabled={uploading || profileLoading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />
          <PageAvatarActions>
            <PageInlineActions spaced="none">
              <Button
                type="button"
                variant="outline"
                disabled={uploading || profileLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Working…" : "Upload photo"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={uploading || profileLoading || !avatarUrl.trim()}
                onClick={() => void removeAvatar()}
              >
                Remove photo
              </Button>
            </PageInlineActions>
            <PageAvatarHint>
              If you do not upload a photo, we show your{" "}
              <PageExternalLink href="https://gravatar.com">
                Gravatar
              </PageExternalLink>{" "}
              for this email, then the default icon.
            </PageAvatarHint>
          </PageAvatarActions>
        </PageAvatarRow>
      </PageAvatarSection>
      <FormField>
        <Label htmlFor="pf-name">Display name</Label>
        <Input
          id="pf-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          disabled={profileLoading}
        />
      </FormField>
      <PageFitButton>
        <Button disabled={saving || profileLoading} onClick={() => void save()}>
          Save changes
        </Button>
      </PageFitButton>
    </PageProfileGrid>
  );
}

export function ProfilePage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: Boolean(user),
  });

  return (
    <AppPageLayout>
      <PageBackButton />
      <PagePanel>
        <PageDisplayTitle>Profile</PageDisplayTitle>
        <PageLead>
          Update how you appear in the app. Email is managed by your account
          provider.
        </PageLead>
        {user?.email ? (
          <PageEmailLine highlight={user.email}>Signed in as </PageEmailLine>
        ) : null}
        {user ? (
          <ProfileEditor
            key={profileQuery.data?.updated_at ?? user.id}
            profile={profileQuery.data ?? null}
            user={user}
            profileLoading={profileQuery.isLoading}
          />
        ) : null}
      </PagePanel>
    </AppPageLayout>
  );
}
