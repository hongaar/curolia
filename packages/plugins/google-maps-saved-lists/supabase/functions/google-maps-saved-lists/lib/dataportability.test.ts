import { describe, expect, it } from "vitest";
import {
  parseExistingJobIdFromError,
  portabilityArchiveStateUrl,
} from "./dataportability.ts";

describe("portabilityArchiveStateUrl", () => {
  it("builds the archiveJobs state endpoint", () => {
    expect(
      portabilityArchiveStateUrl("babe77e4-9c0f-40ff-bdec-be68ad0311bf"),
    ).toBe(
      "https://dataportability.googleapis.com/v1/archiveJobs/babe77e4-9c0f-40ff-bdec-be68ad0311bf/portabilityArchiveState",
    );
  });
});

describe("parseExistingJobIdFromError", () => {
  it("extracts job id from Google duplicate-export message", () => {
    const msg =
      "Requested resources have already been exported in job babe77e4-9c0f-40ff-bdec-be68ad0311bf matching this request.";
    expect(parseExistingJobIdFromError(msg)).toBe(
      "babe77e4-9c0f-40ff-bdec-be68ad0311bf",
    );
  });

  it("returns null when no job id present", () => {
    expect(parseExistingJobIdFromError("something else")).toBeNull();
  });
});
