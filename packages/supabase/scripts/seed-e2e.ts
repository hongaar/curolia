#!/usr/bin/env tsx
/**
 * Additive E2E seed for local Supabase. Never calls db:reset — only upserts
 * namespaced rows owned by the E2E test user/map.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  E2E_CLUSTER_PIN_ID,
  E2E_MAP_CENTER,
  E2E_MAP_ID,
  E2E_MAP_SLUG,
  E2E_PIN_COUNT,
  E2E_PROFILE_SLUG,
  E2E_TAG_A_ID,
  E2E_TAG_B_ID,
  E2E_TARGET_PIN_ID,
  E2E_TARGET_PIN_SLUG,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  buildE2eSeedFixture,
} from "./e2e-seed-constants.ts";
import { requireSupabaseEnv } from "./require-supabase-env.ts";

const SUPABASE_URL = requireSupabaseEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requireSupabaseEnv("SUPABASE_SERVICE_ROLE_KEY");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const fixturePath = path.resolve(repoRoot, "tests/e2e/fixtures/seed.json");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email: string): Promise<string | null> {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((user) => user.email === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureUser(): Promise<string> {
  const override = process.env.CUROLIA_E2E_USER_ID;
  if (override) return override;

  const existing = await findUserByEmail(E2E_USER_EMAIL);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "E2E Seed" },
  });
  if (error) {
    const retry = await findUserByEmail(E2E_USER_EMAIL);
    if (retry) return retry;
    throw error;
  }
  return data.user.id;
}

async function ensureProfile(userId: string): Promise<void> {
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      display_name: "E2E Seed",
      slug: E2E_PROFILE_SLUG,
      is_public: true,
      onboarding_completed: true,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function ensureMap(userId: string): Promise<void> {
  const { error: mapError } = await admin.from("maps").upsert(
    {
      id: E2E_MAP_ID,
      name: "E2E Dense Map",
      slug: E2E_MAP_SLUG,
      created_by_user_id: userId,
      is_public: true,
      description: "Automated E2E performance and behavior tests",
      icon_emoji: "🧪",
    },
    { onConflict: "id" },
  );
  if (mapError) throw mapError;

  const { error: memberError } = await admin
    .from("map_members")
    .upsert(
      { map_id: E2E_MAP_ID, user_id: userId, role: "owner" },
      { onConflict: "map_id,user_id" },
    );
  if (memberError) throw memberError;
}

async function ensureUserPlugins(userId: string): Promise<void> {
  const { error } = await admin.from("user_plugins").upsert(
    {
      user_id: userId,
      plugin_type_id: "poi",
      enabled: true,
    },
    { onConflict: "user_id,plugin_type_id" },
  );
  if (error) throw error;
}

async function ensureTags(): Promise<void> {
  const tags = [
    {
      id: E2E_TAG_A_ID,
      map_id: E2E_MAP_ID,
      name: "E2E Cafés",
      color: "#f97316",
      icon_emoji: "☕",
    },
    {
      id: E2E_TAG_B_ID,
      map_id: E2E_MAP_ID,
      name: "E2E Parks",
      color: "#22c55e",
      icon_emoji: "🌳",
    },
  ];
  const { error } = await admin.from("tags").upsert(tags, { onConflict: "id" });
  if (error) throw error;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildPinRows(userId: string) {
  const rows: Array<{
    id: string;
    map_id: string;
    title: string;
    slug: string;
    lat: number;
    lng: number;
    created_by_user_id: string;
    description: string | null;
  }> = [];

  rows.push({
    id: E2E_TARGET_PIN_ID,
    map_id: E2E_MAP_ID,
    title: "E2E Target Pin",
    slug: E2E_TARGET_PIN_SLUG,
    lat: E2E_MAP_CENTER.lat + 0.01,
    lng: E2E_MAP_CENTER.lng + 0.01,
    created_by_user_id: userId,
    description: "Stable pin for pin-detail E2E flows",
  });

  for (let cluster = 0; cluster < 8; cluster += 1) {
    const id =
      cluster === 0
        ? E2E_CLUSTER_PIN_ID
        : `a0000000-0000-4000-8000-${String(100 + cluster).padStart(12, "0")}`;
    rows.push({
      id,
      map_id: E2E_MAP_ID,
      title: `E2E Cluster Pin ${cluster + 1}`,
      slug: `e2e-cluster-${cluster + 1}`,
      lat: E2E_MAP_CENTER.lat + cluster * 0.00001,
      lng: E2E_MAP_CENTER.lng + cluster * 0.00001,
      created_by_user_id: userId,
      description: "Overlapping cluster for collision E2E",
    });
  }

  let index = 0;
  while (rows.length < E2E_PIN_COUNT) {
    const r1 = pseudoRandom(index + 1);
    const r2 = pseudoRandom(index + 2);
    const lat = E2E_MAP_CENTER.lat + (r1 - 0.5) * 0.08;
    const lng = E2E_MAP_CENTER.lng + (r2 - 0.5) * 0.12;
    const pinIndex = index + 1;
    rows.push({
      id: `a0000000-0000-4000-8000-${String(200 + pinIndex).padStart(12, "0")}`,
      map_id: E2E_MAP_ID,
      title: `E2E Pin ${pinIndex}`,
      slug: `e2e-pin-${pinIndex}`,
      lat,
      lng,
      created_by_user_id: userId,
      description: null,
    });
    index += 1;
  }

  return rows;
}

async function reconcilePins(userId: string): Promise<void> {
  const { count, error: countError } = await admin
    .from("pins")
    .select("id", { count: "exact", head: true })
    .eq("map_id", E2E_MAP_ID);
  if (countError) throw countError;

  if ((count ?? 0) === E2E_PIN_COUNT) {
    console.log(`E2E pins already seeded (${count} pins)`);
    return;
  }

  console.log(
    `Reconciling E2E pins (had ${count ?? 0}, want ${E2E_PIN_COUNT})`,
  );
  const { error: deleteError } = await admin
    .from("pins")
    .delete()
    .eq("map_id", E2E_MAP_ID);
  if (deleteError) throw deleteError;

  const rows = buildPinRows(userId);
  const batchSize = 100;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const { error } = await admin.from("pins").insert(batch);
    if (error) throw error;
  }
}

function writeFixture(userId: string): void {
  const fixture = { ...buildE2eSeedFixture(), userId };
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Wrote ${fixturePath}`);
}

async function main(): Promise<void> {
  const userId = await ensureUser();
  await ensureProfile(userId);
  await ensureMap(userId);
  await ensureUserPlugins(userId);
  await ensureTags();
  await reconcilePins(userId);
  writeFixture(userId);
  console.log("E2E seed complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
