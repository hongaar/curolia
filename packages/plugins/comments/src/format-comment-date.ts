const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Compact relative time for comment bylines (e.g. "just now", "3d ago"). */
export function formatCommentDate(iso: string, nowMs = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffSec = Math.max(0, Math.floor((nowMs - date.getTime()) / 1000));

  if (diffSec < 45) return "just now";
  if (diffSec < MINUTE) return "1m ago";

  const minutes = Math.floor(diffSec / MINUTE);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diffSec / HOUR);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffSec / DAY);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(diffSec / WEEK);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(diffSec / MONTH);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(diffSec / YEAR);
  return `${Math.max(years, 1)}y ago`;
}
