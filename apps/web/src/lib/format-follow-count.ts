export function formatFollowCountLabel(
  count: number,
  kind: "follower" | "following",
): string {
  if (kind === "following") {
    return `${count.toLocaleString()} following`;
  }
  const noun = count === 1 ? "follower" : "followers";
  return `${count.toLocaleString()} ${noun}`;
}
