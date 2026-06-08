import { supabase } from "@/lib/supabase";

/**
 * First-run onboarding completion is stored on the user's profile so it
 * persists across devices and browsers. Legacy per-device localStorage flags
 * are migrated once on read.
 */
const LEGACY_KEY_PREFIX = "onboarding:completed:";

function legacyStorageKey(userId: string): string {
  return `${LEGACY_KEY_PREFIX}${userId}`;
}

function hasLegacyLocalCompletion(userId: string): boolean {
  try {
    return localStorage.getItem(legacyStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

function clearLegacyLocalCompletion(userId: string): void {
  try {
    localStorage.removeItem(legacyStorageKey(userId));
  } catch {
    /* ignore */
  }
}

export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data?.onboarding_completed) return true;

  if (hasLegacyLocalCompletion(userId)) {
    await setOnboardingCompleted(userId);
    return true;
  }
  return false;
}

export async function setOnboardingCompleted(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", userId);
  if (error) throw error;
  clearLegacyLocalCompletion(userId);
}
