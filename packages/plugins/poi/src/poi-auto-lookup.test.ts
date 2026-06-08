import { describe, expect, it } from "vitest";
import {
  isMapPoiAutoLookupEnabled,
  resolvePoiMetadataLoading,
  shouldTriggerPoiAutoLookup,
} from "./poi-auto-lookup";
import type { PoiPinPayload } from "./poi-pin-data";

const basePayload: PoiPinPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  osmType: "node",
  osmId: 1,
  tags: { name: "Cafe" },
};

const noPoiPayload: PoiPinPayload = {
  schemaVersion: 1,
  lat: 52.1,
  lng: 5.1,
  fetchedAt: new Date().toISOString(),
  noPoi: true,
};

describe("isMapPoiAutoLookupEnabled", () => {
  it("is false when map plugin is disabled", () => {
    expect(
      isMapPoiAutoLookupEnabled({
        enabled: false,
        config: { syncEvents: ["pin_coordinates_changed"] },
      }),
    ).toBe(false);
  });

  it("is true when syncEvents includes pin_coordinates_changed", () => {
    expect(
      isMapPoiAutoLookupEnabled({
        enabled: true,
        config: { syncEvents: ["pin_coordinates_changed"] },
      }),
    ).toBe(true);
  });

  it("is false when syncEvents is empty", () => {
    expect(
      isMapPoiAutoLookupEnabled({
        enabled: true,
        config: { syncEvents: [] },
      }),
    ).toBe(false);
  });
});

describe("resolvePoiMetadataLoading", () => {
  const base = {
    pluginEnabled: true,
    autoLookupEnabled: true,
    canSync: true,
    syncJobStatus: null,
    entityDataPending: false,
    cachedPayload: null,
    autoLookupInFlight: false,
    autoLookupFailed: false,
    metadataFetching: false,
    metadataIsFresh: false,
    metadataQueryError: false,
  };

  it("never loads when auto-lookup is off", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        autoLookupEnabled: false,
        syncJobStatus: "pending",
      }),
    ).toBe(false);
  });

  it("never loads when plugin is disabled", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        pluginEnabled: false,
        syncJobStatus: "pending",
      }),
    ).toBe(false);
  });

  it("does not load after auto-lookup found no nearby place", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        cachedPayload: noPoiPayload,
        syncJobStatus: "completed",
      }),
    ).toBe(false);
  });

  it("does not load when sync job failed", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        syncJobStatus: "failed",
      }),
    ).toBe(false);
  });

  it("does not load when inline auto-lookup failed", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        autoLookupFailed: true,
        syncJobStatus: "pending",
      }),
    ).toBe(false);
  });

  it("loads while a pending sync job exists", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        syncJobStatus: "pending",
      }),
    ).toBe(true);
  });

  it("loads while inline auto-lookup is in flight", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        autoLookupInFlight: true,
      }),
    ).toBe(true);
  });

  it("loads while metadata is catching up for a linked place", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        cachedPayload: basePayload,
        metadataFetching: true,
        metadataIsFresh: false,
      }),
    ).toBe(true);
  });

  it("stops loading once metadata is fresh for a linked place", () => {
    expect(
      resolvePoiMetadataLoading({
        ...base,
        cachedPayload: basePayload,
        metadataIsFresh: true,
        metadataFetching: false,
        syncJobStatus: "completed",
      }),
    ).toBe(false);
  });
});

describe("shouldTriggerPoiAutoLookup", () => {
  it("triggers when auto-lookup is on and no cached result yet", () => {
    expect(
      shouldTriggerPoiAutoLookup({
        autoLookupEnabled: true,
        canSync: true,
        cachedPayload: null,
        syncJobStatus: "pending",
        autoLookupInFlight: false,
        autoLookupFailed: false,
      }),
    ).toBe(true);
  });

  it("does not trigger when auto-lookup is off", () => {
    expect(
      shouldTriggerPoiAutoLookup({
        autoLookupEnabled: false,
        canSync: true,
        cachedPayload: null,
        syncJobStatus: null,
        autoLookupInFlight: false,
        autoLookupFailed: false,
      }),
    ).toBe(false);
  });

  it("does not trigger when a prior lookup already cached noPoi", () => {
    expect(
      shouldTriggerPoiAutoLookup({
        autoLookupEnabled: true,
        canSync: true,
        cachedPayload: noPoiPayload,
        syncJobStatus: "completed",
        autoLookupInFlight: false,
        autoLookupFailed: false,
      }),
    ).toBe(false);
  });

  it("does not trigger while a request is already in flight", () => {
    expect(
      shouldTriggerPoiAutoLookup({
        autoLookupEnabled: true,
        canSync: true,
        cachedPayload: null,
        syncJobStatus: "pending",
        autoLookupInFlight: true,
        autoLookupFailed: false,
      }),
    ).toBe(false);
  });

  it("does not retry after inline auto-lookup failed", () => {
    expect(
      shouldTriggerPoiAutoLookup({
        autoLookupEnabled: true,
        canSync: true,
        cachedPayload: null,
        syncJobStatus: "pending",
        autoLookupInFlight: false,
        autoLookupFailed: true,
      }),
    ).toBe(false);
  });
});
