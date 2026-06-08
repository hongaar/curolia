/**
 * First-run onboarding completion is tracked per user id in localStorage so the
 * guided tour is shown once after the first sign in on a device and not again.
 */
const ONBOARDING_KEY_PREFIX = "onboarding:completed:";

function storageKey(userId: string): string {
  return `${ONBOARDING_KEY_PREFIX}${userId}`;
}

export function hasCompletedOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(userId: string): void {
  try {
    localStorage.setItem(storageKey(userId), "1");
  } catch {
    /* ignore */
  }
}
