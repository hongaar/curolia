const STORAGE_KEY = "curolia-guest-id";

export function getOrCreateGuestId(): string {
  if (typeof localStorage === "undefined") {
    return crypto.randomUUID();
  }
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
