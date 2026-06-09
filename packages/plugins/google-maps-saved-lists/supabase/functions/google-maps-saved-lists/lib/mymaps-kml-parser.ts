import type { ParsedPlace } from "./google-maps-parsers.ts";

function mapNameSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export type ParsedMyMap = {
  name: string;
  places: ParsedPlace[];
};

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCdata(text: string): string {
  return text.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/i, "$1").trim();
}

function extractTagContent(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(re);
  if (!match?.[1]) return null;
  const raw = stripCdata(match[1].trim());
  return decodeXmlEntities(stripHtml(raw));
}

function extractPlacemarkBlocks(kml: string): string[] {
  const blocks: string[] = [];
  const re = /<Placemark(?:\s[^>]*)?>[\s\S]*?<\/Placemark>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(kml)) !== null) {
    blocks.push(match[0]!);
  }
  return blocks;
}

function isPointPlacemark(block: string): boolean {
  if (/<LineString[\s>]/i.test(block)) return false;
  if (/<Polygon[\s>]/i.test(block)) return false;
  if (/<gx:Track[\s>]/i.test(block)) return false;
  if (/<MultiGeometry[\s>]/i.test(block) && !/<Point[\s>]/i.test(block)) {
    return false;
  }
  return /<Point[\s>]/i.test(block);
}

function parsePointCoords(block: string): { lat: number; lng: number } | null {
  const coordsText = extractTagContent(block, "coordinates");
  if (!coordsText) return null;
  const firstTriple = coordsText.trim().split(/\s+/)[0];
  if (!firstTriple) return null;
  const parts = firstTriple.split(",").map((part) => Number(part.trim()));
  if (parts.length < 2) return null;
  const lng = parts[0]!;
  const lat = parts[1]!;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function isGenericMapFileName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized === "doc" || normalized === "map" || normalized === "untitled"
  );
}

function mapNameFromPath(filePath: string): string | null {
  const base = filePath.split("/").pop() ?? filePath;
  if (/\.kml$/i.test(base)) {
    const parent = filePath.split("/").slice(-2, -1)[0];
    if (parent && parent !== "images" && !isGenericMapFileName(parent)) {
      return decodeXmlEntities(parent.replace(/_/g, " "));
    }
    const fromBase = base.replace(/\.kml$/i, "").replace(/_/g, " ");
    if (fromBase && !isGenericMapFileName(fromBase)) return fromBase;
    return null;
  }
  if (/\.kmz$/i.test(base)) {
    const fromBase = base.replace(/\.kmz$/i, "").replace(/_/g, " ");
    if (fromBase && !isGenericMapFileName(fromBase)) return fromBase;
    return null;
  }
  return null;
}

function extractDocumentName(kml: string): string | null {
  const docMatch = kml.match(
    /<Document[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i,
  );
  if (docMatch?.[1]) {
    return decodeXmlEntities(stripHtml(stripCdata(docMatch[1].trim())));
  }
  return extractTagContent(kml, "name");
}

export function resolveMyMapName(archivePath: string, kml: string): string {
  const docName = extractDocumentName(kml);
  if (docName?.trim() && !isGenericMapFileName(docName)) {
    return docName.trim();
  }

  const fromPath = mapNameFromPath(archivePath);
  if (fromPath?.trim()) return fromPath.trim();

  if (docName?.trim()) return docName.trim();
  return "Untitled map";
}

function googleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

function myMapPlaceDedupKey(
  mapName: string,
  title: string,
  lat: number,
  lng: number,
): string {
  const slug = mapNameSlug(mapName);
  const label = title.trim().toLowerCase() || "place";
  return `mymap:${slug}:${lat.toFixed(6)},${lng.toFixed(6)}:${label}`;
}

export function parseMyMapKml(kml: string, mapName: string): ParsedPlace[] {
  const places: ParsedPlace[] = [];
  for (const block of extractPlacemarkBlocks(kml)) {
    if (!isPointPlacemark(block)) continue;

    const coords = parsePointCoords(block);
    if (!coords) continue;

    const title = extractTagContent(block, "name")?.trim() || "Place";
    const description = extractTagContent(block, "description");
    const note = description?.trim() ? description.trim() : null;

    places.push({
      dedupKey: myMapPlaceDedupKey(mapName, title, coords.lat, coords.lng),
      title,
      note,
      googleMapsUrl: googleMapsSearchUrl(coords.lat, coords.lng),
      lat: coords.lat,
      lng: coords.lng,
      source: "mymap",
      collectionName: mapName,
    });
  }
  return places;
}

export function parseMyMapsFromKmlEntries(
  entries: { archivePath: string; kml: string }[],
): ParsedMyMap[] {
  const byName = new Map<string, ParsedPlace[]>();

  for (const entry of entries) {
    const mapName = resolveMyMapName(entry.archivePath, entry.kml);
    const places = parseMyMapKml(entry.kml, mapName);
    if (places.length === 0) continue;

    const existing = byName.get(mapName) ?? [];
    existing.push(...places);
    byName.set(mapName, existing);
  }

  return [...byName.entries()]
    .map(([name, places]) => ({ name, places }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
