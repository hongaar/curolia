import { unzipSync } from "npm:fflate@0.8.2";
import {
  parseMyMapsFromKmlEntries,
  type ParsedMyMap,
} from "./mymaps-kml-parser.ts";

function kmlEntriesFromArchiveFile(
  filePath: string,
  bytes: Uint8Array,
): { path: string; kml: string }[] {
  const isZip =
    filePath.toLowerCase().endsWith(".kmz") ||
    (bytes[0] === 0x50 && bytes[1] === 0x4b);

  if (isZip) {
    const entries = unzipSync(bytes);
    return Object.entries(entries)
      .filter(([name]) => name.toLowerCase().endsWith(".kml"))
      .map(([name, entryBytes]) => ({
        path: name,
        kml: new TextDecoder().decode(entryBytes),
      }));
  }

  if (filePath.toLowerCase().endsWith(".kml")) {
    return [{ path: filePath, kml: new TextDecoder().decode(bytes) }];
  }

  return [];
}

export function parseMyMapsExportFiles(
  files: { name: string; bytes: Uint8Array }[],
): ParsedMyMap[] {
  const kmlEntries: { path: string; kml: string }[] = [];

  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".kml") && !lower.endsWith(".kmz")) continue;

    for (const entry of kmlEntriesFromArchiveFile(file.name, file.bytes)) {
      kmlEntries.push({
        // KMZ archives always contain `doc.kml`; use the outer archive path for naming.
        archivePath: file.name,
        kml: entry.kml,
      });
    }
  }

  return parseMyMapsFromKmlEntries(kmlEntries);
}
