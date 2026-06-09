import { describe, expect, it } from "vitest";
import {
  parseMyMapKml,
  parseMyMapsFromKmlEntries,
  resolveMyMapName,
} from "./mymaps-kml-parser.ts";

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Weekend trip</name>
    <Placemark>
      <name>Eiffel Tower</name>
      <description>Must see</description>
      <Point><coordinates>2.2945,48.8584,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Walking route</name>
      <LineString><coordinates>2.29,48.85,0 2.30,48.86,0</coordinates></LineString>
    </Placemark>
  </Document>
</kml>`;

describe("parseMyMapKml", () => {
  it("imports point placemarks and skips lines", () => {
    const places = parseMyMapKml(SAMPLE_KML, "Weekend trip");
    expect(places).toHaveLength(1);
    expect(places[0]?.title).toBe("Eiffel Tower");
    expect(places[0]?.note).toBe("Must see");
    expect(places[0]?.lat).toBeCloseTo(48.8584, 4);
    expect(places[0]?.lng).toBeCloseTo(2.2945, 4);
    expect(places[0]?.source).toBe("mymap");
    expect(places[0]?.collectionName).toBe("Weekend trip");
    expect(places[0]?.googleMapsUrl).toContain("48.8584");
  });
});

describe("resolveMyMapName", () => {
  it("prefers the KML document title over inner doc.kml paths", () => {
    expect(resolveMyMapName("doc.kml", SAMPLE_KML)).toBe("Weekend trip");
    expect(
      resolveMyMapName(
        "Takeout/My Maps/Huizen/Huizen.kmz",
        SAMPLE_KML.replace("Weekend trip", "Huizen"),
      ),
    ).toBe("Huizen");
  });
});

describe("parseMyMapsFromKmlEntries", () => {
  it("groups placemarks by map name from archive path", () => {
    const maps = parseMyMapsFromKmlEntries([
      {
        archivePath: "mymaps/Weekend trip/Weekend trip.kmz",
        kml: SAMPLE_KML,
      },
    ]);
    expect(maps).toHaveLength(1);
    expect(maps[0]?.name).toBe("Weekend trip");
    expect(maps[0]?.places).toHaveLength(1);
  });

  it("keeps separate maps when KMZ inner files are all named doc.kml", () => {
    const huizen = SAMPLE_KML.replace("Weekend trip", "Huizen");
    const zeist = SAMPLE_KML.replace("Weekend trip", "Parkeren Zeist");
    const maps = parseMyMapsFromKmlEntries([
      { archivePath: "Takeout/My Maps/Huizen/Huizen.kmz", kml: huizen },
      {
        archivePath: "Takeout/My Maps/Parkeren Zeist/Parkeren Zeist.kmz",
        kml: zeist,
      },
    ]);
    expect(maps.map((map) => map.name).sort()).toEqual([
      "Huizen",
      "Parkeren Zeist",
    ]);
  });
});
