import type { PinWithTags } from "@/lib/pin-with-tags";

export function pinDetailSideSheetTitle(
  pin: Pick<PinWithTags, "title"> | null | undefined,
): string {
  return pin?.title?.trim() || "Pin details";
}
