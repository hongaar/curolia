import { describe, expect, it } from "vitest";
import {
  LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS,
  listDiscoveryCoordProgress,
  listDiscoveryExportProgress,
} from "./list-discovery-progress.ts";

describe("listDiscoveryExportProgress", () => {
  it("allocates a small slice to each export step", () => {
    expect(listDiscoveryExportProgress(0, 0)).toBe(0);
    expect(listDiscoveryExportProgress(0, 1)).toBe(5);
    expect(listDiscoveryExportProgress(1, 0)).toBe(5);
    expect(listDiscoveryExportProgress(1, 1)).toBe(10);
    expect(listDiscoveryExportProgress(2, 0)).toBe(10);
    expect(listDiscoveryExportProgress(2, 1)).toBe(
      LIST_DISCOVERY_EXPORT_COMPLETE_PROGRESS,
    );
  });
});

describe("listDiscoveryCoordProgress", () => {
  it("uses most of the bar for coordinate resolution", () => {
    expect(listDiscoveryCoordProgress(0, 740)).toBe(15);
    expect(listDiscoveryCoordProgress(370, 740)).toBe(57);
    expect(listDiscoveryCoordProgress(740, 740)).toBe(100);
  });
});
