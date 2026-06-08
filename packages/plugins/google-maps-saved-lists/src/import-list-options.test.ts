import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsImportListOptions,
  collectionListOptionId,
  listOptionIdFromSource,
  resolveImportedListOptionIds,
} from "./import-list-options";

describe("list option ids", () => {
  it("uses slug ids for collections", () => {
    expect(
      listOptionIdFromSource({ type: "collection", name: "60 in wales" }),
    ).toBe("60-in-wales");
    expect(collectionListOptionId("60 in wales")).toBe("60-in-wales");
  });

  it("resolves legacy display-name ids to checklist option ids", () => {
    const options = buildGoogleMapsImportListOptions({
      starred: true,
      starredCount: 2,
      collections: [{ id: "60-in-wales", name: "60 in wales", itemCount: 10 }],
    });

    expect(
      resolveImportedListOptionIds({
        configIds: ["60 in wales"],
        options,
      }),
    ).toEqual(["60-in-wales"]);

    expect(
      resolveImportedListOptionIds({
        completedJobSources: [{ type: "collection", name: "60 in wales" }],
        options,
      }),
    ).toEqual(["60-in-wales"]);
  });
});
