/** Shared identifiers for E2E seed data — stable across local runs and CI. */

export const E2E_USER_ID = "00000000-0000-4000-a000-000000000001";
export const E2E_MAP_ID = "00000000-0000-4000-a000-000000000002";
export const E2E_TARGET_PIN_ID = "00000000-0000-4000-a000-000000000003";
export const E2E_CLUSTER_PIN_ID = "00000000-0000-4000-a000-000000000004";
export const E2E_TAG_A_ID = "00000000-0000-4000-a000-000000000010";
export const E2E_TAG_B_ID = "00000000-0000-4000-a000-000000000011";

export const E2E_USER_EMAIL = "e2e+seed@curolia.test";
export const E2E_USER_PASSWORD = "e2e-test-password-secure";
export const E2E_PROFILE_SLUG = "e2e-seed";
export const E2E_MAP_SLUG = "e2e-dense";
export const E2E_TARGET_PIN_SLUG = "e2e-target-pin";
export const E2E_PIN_COUNT = 750;

/** Amsterdam-centre bbox for generated pins. */
export const E2E_MAP_CENTER = { lat: 52.3676, lng: 4.9041 };
export const E2E_MAP_ZOOM = 12;

export type E2eSeedFixture = {
  userId: string;
  userEmail: string;
  userPassword: string;
  profileSlug: string;
  mapId: string;
  mapSlug: string;
  mapUrl: string;
  targetPinId: string;
  targetPinSlug: string;
  clusterPinId: string;
  pinCount: number;
  mapCenter: { lat: number; lng: number };
  mapZoom: number;
};

export function buildE2eSeedFixture(userId = E2E_USER_ID): E2eSeedFixture {
  return {
    userId,
    userEmail: E2E_USER_EMAIL,
    userPassword: E2E_USER_PASSWORD,
    profileSlug: E2E_PROFILE_SLUG,
    mapId: E2E_MAP_ID,
    mapSlug: E2E_MAP_SLUG,
    mapUrl: `/${E2E_PROFILE_SLUG}/${E2E_MAP_SLUG}/map`,
    targetPinId: E2E_TARGET_PIN_ID,
    targetPinSlug: E2E_TARGET_PIN_SLUG,
    clusterPinId: E2E_CLUSTER_PIN_ID,
    pinCount: E2E_PIN_COUNT,
    mapCenter: E2E_MAP_CENTER,
    mapZoom: E2E_MAP_ZOOM,
  };
}
