const STORAGE_KEY = "curolia-comments-display-name";

export function getStoredCommentDisplayName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
}

export function setStoredCommentDisplayName(name: string): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
