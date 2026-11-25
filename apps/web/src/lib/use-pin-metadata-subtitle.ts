import { usePinMetadataRows } from "@/lib/use-pin-metadata";
import {
  pinMetadataSubtitleFromRows,
  type PinMetadataSubtitle,
} from "@curolia/plugin-contract";
import { useMemo } from "react";

export type UsePinMetadataSubtitleArgs = {
  pinId: string | undefined;
};

export function usePinMetadataSubtitle({
  pinId,
}: UsePinMetadataSubtitleArgs): PinMetadataSubtitle | null {
  const rowsQuery = usePinMetadataRows(pinId);

  return useMemo(() => {
    if (!rowsQuery.data) return null;
    return pinMetadataSubtitleFromRows(rowsQuery.data);
  }, [rowsQuery.data]);
}
