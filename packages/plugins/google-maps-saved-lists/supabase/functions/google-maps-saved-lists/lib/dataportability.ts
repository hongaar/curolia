const DP_INITIATE =
  "https://dataportability.googleapis.com/v1/portabilityArchive:initiate";
const DP_API_BASE = "https://dataportability.googleapis.com/v1";

/** Normalize job id from initiate or duplicate-export errors. */
export function portabilityArchiveStateUrl(archiveJobId: string): string {
  const id = archiveJobId
    .replace(/^archiveJobs\//, "")
    .replace(/\/portabilityArchiveState$/, "");
  return `${DP_API_BASE}/archiveJobs/${encodeURIComponent(id)}/portabilityArchiveState`;
}

export type DataPortabilityResource =
  | "maps.starred_places"
  | "saved.collections";

export type ExportAccessType =
  | "ACCESS_TYPE_ONE_TIME"
  | "ACCESS_TYPE_TIME_BASED"
  | "ACCESS_TYPE_UNSPECIFIED";

export type ExportBundle = {
  resource: DataPortabilityResource;
  accessType: ExportAccessType;
  archiveJobId: string;
  files: { name: string; bytes: Uint8Array }[];
  exportedAt: string;
};

type ArchiveStateResponse = {
  archiveJobId?: string;
  state?: string;
  urls?: string[];
  error?: { message?: string };
};

const POLL_MS = 3000;
export const DATA_PORTABILITY_MAX_POLL_MS = 5 * 60 * 1000;
const MAX_POLL_MS = DATA_PORTABILITY_MAX_POLL_MS;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Google returns this when the same resource was exported within 24h (or one-time consent). */
export function parseExistingJobIdFromError(message: string): string | null {
  const jobMatch = message.match(/job\s+([0-9a-f-]{36})/i);
  if (jobMatch?.[1]) return jobMatch[1]!.toLowerCase();
  const any = message.match(UUID_RE);
  return any?.[0]?.toLowerCase() ?? null;
}

export async function initiatePortabilityExport(
  accessToken: string,
  resource: DataPortabilityResource,
): Promise<{ archiveJobId: string; accessType: ExportAccessType }> {
  const res = await fetch(DP_INITIATE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resources: [resource] }),
  });
  const json = (await res.json()) as {
    archiveJobId?: string;
    accessType?: ExportAccessType;
    error?: { message?: string; status?: string };
  };
  if (res.ok && json.archiveJobId) {
    return {
      archiveJobId: json.archiveJobId,
      accessType: json.accessType ?? "ACCESS_TYPE_UNSPECIFIED",
    };
  }

  const message =
    json.error?.message ?? `dataportability_initiate_failed_${res.status}`;
  const existingJobId = parseExistingJobIdFromError(message);
  if (existingJobId) {
    return {
      archiveJobId: existingJobId,
      accessType: json.accessType ?? "ACCESS_TYPE_UNSPECIFIED",
    };
  }

  throw new Error(message);
}

async function pollArchiveState(
  accessToken: string,
  archiveJobId: string,
): Promise<ArchiveStateResponse> {
  const url = portabilityArchiveStateUrl(archiveJobId);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `dataportability_poll_failed_${res.status}: ${text.slice(0, 200)}`,
    );
  }
  try {
    return JSON.parse(text) as ArchiveStateResponse;
  } catch {
    throw new Error(`dataportability_poll_invalid_json: ${text.slice(0, 120)}`);
  }
}

async function downloadArchiveFiles(
  urls: string[],
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const out: { name: string; bytes: Uint8Array }[] = [];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`dataportability_download_failed_${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    const name = url.split("/").pop()?.split("?")[0] ?? "archive.zip";
    out.push({ name, bytes: buf });
  }
  return out;
}

async function unzipEntries(
  zipBytes: Uint8Array,
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const { unzipSync } = await import("npm:fflate@0.8.2");
  const entries = unzipSync(zipBytes);
  return Object.entries(entries).map(([name, bytes]) => ({
    name,
    bytes,
  }));
}

export async function runPortabilityExport(
  accessToken: string,
  resource: DataPortabilityResource,
  options?: {
    onPoll?: (state: string, elapsedMs: number) => void | Promise<void>;
  },
): Promise<ExportBundle> {
  const { archiveJobId, accessType } = await initiatePortabilityExport(
    accessToken,
    resource,
  );

  const started = Date.now();
  let state: ArchiveStateResponse | null = null;
  while (Date.now() - started < MAX_POLL_MS) {
    state = await pollArchiveState(accessToken, archiveJobId);
    const st = state.state ?? "";
    await options?.onPoll?.(st, Date.now() - started);
    if (st === "COMPLETE" || st === "STATE_COMPLETE") break;
    if (st === "FAILED" || st === "STATE_FAILED") {
      throw new Error(state.error?.message ?? "dataportability_export_failed");
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  const urls = state?.urls ?? [];
  if (urls.length === 0) {
    throw new Error("dataportability_export_timeout");
  }

  const downloads = await downloadArchiveFiles(urls);
  const files: { name: string; bytes: Uint8Array }[] = [];
  for (const dl of downloads) {
    if (
      dl.name.endsWith(".zip") ||
      (dl.bytes[0] === 0x50 && dl.bytes[1] === 0x4b)
    ) {
      files.push(...(await unzipEntries(dl.bytes)));
    } else {
      files.push(dl);
    }
  }

  return {
    resource,
    accessType,
    archiveJobId,
    files,
    exportedAt: new Date().toISOString(),
  };
}

export function nextEligibleExportAt(fromIso: string): string {
  return new Date(
    new Date(fromIso).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function canExportNow(lastExportAt: string | undefined): boolean {
  if (!lastExportAt) return true;
  return Date.now() >= new Date(lastExportAt).getTime() + 24 * 60 * 60 * 1000;
}
