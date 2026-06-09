import { supabase } from "@/lib/supabase";

export function profileSlugSaveErrorMessage(error: {
  message: string;
  code?: string;
}): string {
  const message = error.message ?? "";

  if (
    message.includes("profile_slug_redirects") &&
    message.includes("row-level security")
  ) {
    return "That profile URL is already taken. Try a different one.";
  }

  if (error.code === "23505" && message.includes("profiles_slug")) {
    return "That profile URL is already taken. Try a different one.";
  }

  if (error.code === "23514" && message.includes("profiles_slug_format")) {
    return "Use only lowercase letters, numbers, and hyphens in your profile URL.";
  }

  return message || "Could not save profile.";
}

/** Returns a user-facing message when the slug cannot be claimed as typed. */
export async function validateProfileSlugInput(
  profileId: string,
  desired: string,
  currentSlug?: string | null,
): Promise<string | null> {
  const trimmed = desired.trim();
  if (!trimmed || trimmed === (currentSlug ?? "").trim()) {
    return null;
  }

  const { data: slugified, error: slugifyError } = await supabase.rpc(
    "slugify_text",
    { p_raw: trimmed },
  );
  if (slugifyError) {
    return slugifyError.message;
  }
  if (!slugified) {
    return "Enter a profile URL with letters or numbers.";
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "profile_claim_slug",
    { p_profile_id: profileId, p_desired: trimmed },
  );
  if (claimError) {
    return claimError.message;
  }
  if (claimed !== slugified) {
    return `“${slugified}” is already taken. Try a different profile URL.`;
  }

  return null;
}
