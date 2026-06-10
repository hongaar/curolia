import { PageBackButton } from "@/components/layout/page-back-button";
import { UserAvatar } from "@/components/user-avatar";
import {
  profileSlugSaveErrorMessage,
  validateProfileSlugInput,
} from "@/lib/profile-slug";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  SrOnlyInput,
} from "@curolia/ui/form-layout";
import { Input, PrefixedInput } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  AppPageLayout,
  PageAvatarActions,
  PageAvatarHint,
  PageAvatarRow,
  PageAvatarSection,
  PageEmailLine,
  PageExternalLink,
  PageFitButton,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PagePanel,
  PageProfileGrid,
} from "@curolia/ui/page";
import { Textarea } from "@curolia/ui/textarea";
import type { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_PROFILE_BIO_LENGTH = 500;

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
  const [bio, setBio] = useState(() => profile?.bio ?? "");
  const [profileSlug, setProfileSlug] = useState(() => profile?.slug ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSlugError(null);

    const slugValidation = await validateProfileSlugInput(
      user.id,
      profileSlug,
      profile?.slug,
    );
    if (slugValidation) {
      setSlugError(slugValidation);
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        slug: profileSlug.trim() || undefined,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      const message = profileSlugSaveErrorMessage(error);
      if (message.includes("profile URL")) {
        setSlugError(message);
        return;
      }
      toast.error(message);
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

  const profileUrlPrefix = `${window.location.host}/`;

  return (
    <PageProfileGrid>
      <Field>
        <FieldLabel htmlFor="pf-name">Display name</FieldLabel>
        <FieldControl>
          <Input
            id="pf-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            disabled={profileLoading}
          />
        </FieldControl>
      </Field>
      <Field>
        <FieldLabel htmlFor="pf-bio">Bio</FieldLabel>
        <FieldControl>
          <Textarea
            id="pf-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short intro for visitors on your public map blog"
            disabled={profileLoading}
            maxLength={MAX_PROFILE_BIO_LENGTH}
            rows={3}
          />
        </FieldControl>
        <FieldDescription>
          Optional. Shown on your public map blog when visitors are not signed
          in.
        </FieldDescription>
      </Field>
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
      <Field>
        <FieldLabel htmlFor="pf-slug">Profile URL</FieldLabel>
        <FieldControl>
          <PrefixedInput
            id="pf-slug"
            prefix={profileUrlPrefix}
            value={profileSlug}
            onChange={(e) => {
              setProfileSlug(e.target.value);
              setSlugError(null);
            }}
            placeholder="your-name"
            disabled={profileLoading}
            autoComplete="off"
            aria-invalid={slugError ? true : undefined}
            aria-describedby={slugError ? "pf-slug-error" : undefined}
          />
        </FieldControl>
        {slugError ? (
          <FieldError id="pf-slug-error">{slugError}</FieldError>
        ) : null}
      </Field>
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
        <PageHeader>
          <PageHeaderTitle>Profile</PageHeaderTitle>
          <PageHeaderLead>
            Update how you appear in the app. Email is managed by your account
            provider.
          </PageHeaderLead>
        </PageHeader>
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
