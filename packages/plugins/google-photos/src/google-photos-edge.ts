import type { PinPhotoSuggestion } from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GooglePhotosPickerHint = {
  startDate: string;
  endDate: string;
  lat: number;
  lng: number;
} | null;

export type GooglePhotosPickerSession = {
  mediaItemsSet?: boolean;
  expireTime?: string;
  pollingConfig?: { pollInterval?: string; timeoutIn?: string };
};

function coerceBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

/** Google REST may use camelCase; tolerate snake_case when proxies change shape. */
function normalizePickerSession(data: unknown): GooglePhotosPickerSession {
  if (!data || typeof data !== "object") return {};
  const o = data as Record<string, unknown>;
  const polling = o.pollingConfig ?? o.polling_config;
  const pc =
    polling && typeof polling === "object" && !Array.isArray(polling)
      ? (polling as Record<string, unknown>)
      : {};

  const mediaItemsSet =
    coerceBool(o.mediaItemsSet) ?? coerceBool(o.media_items_set);

  return {
    mediaItemsSet:
      typeof mediaItemsSet === "boolean" ? mediaItemsSet : undefined,
    expireTime:
      typeof o.expireTime === "string"
        ? o.expireTime
        : typeof o.expire_time === "string"
          ? o.expire_time
          : undefined,
    pollingConfig:
      typeof pc.pollInterval === "string" ||
      typeof pc.timeoutIn === "string" ||
      typeof pc.poll_interval === "string" ||
      typeof pc.timeout_in === "string"
        ? {
            pollInterval:
              (typeof pc.pollInterval === "string"
                ? pc.pollInterval
                : typeof pc.poll_interval === "string"
                  ? pc.poll_interval
                  : undefined) ?? undefined,
            timeoutIn:
              (typeof pc.timeoutIn === "string"
                ? pc.timeoutIn
                : typeof pc.timeout_in === "string"
                  ? pc.timeout_in
                  : undefined) ?? undefined,
          }
        : undefined,
  };
}

export async function googlePhotosPickerCreate(
  supabase: SupabaseClient,
  pinId?: string,
): Promise<{
  sessionId: string;
  pickerUri: string;
  expireTime: string | null;
  pickerHint: GooglePhotosPickerHint;
}> {
  const { data, error } = await supabase.functions.invoke<{
    sessionId?: string;
    pickerUri?: string;
    expireTime?: string | null;
    pickerHint?: GooglePhotosPickerHint;
    error?: string;
  }>("google-photos", {
    body: { action: "picker_create", ...(pinId ? { pinId } : {}) },
  });
  if (error) throw error;
  if (data?.error || !data?.sessionId || !data?.pickerUri) {
    throw new Error(data?.error ?? "picker_create_failed");
  }
  return {
    sessionId: data.sessionId,
    pickerUri: data.pickerUri,
    expireTime: data.expireTime ?? null,
    pickerHint: data.pickerHint ?? null,
  };
}

export async function googlePhotosPickerSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<GooglePhotosPickerSession> {
  const { data, error } = await supabase.functions.invoke<
    Record<string, unknown> & { error?: string }
  >("google-photos", {
    body: { action: "picker_session", sessionId },
  });
  if (error) throw error;
  return normalizePickerSession(data);
}

async function googlePhotosPickerListOnce(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<{
  suggestions: PinPhotoSuggestion[];
}> {
  const { data, error } = await supabase.functions.invoke<{
    suggestions?: PinPhotoSuggestion[];
    error?: string;
    message?: string;
  }>("google-photos", {
    body: { action: "picker_list", sessionId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message ?? data.error);
  return { suggestions: data?.suggestions ?? [] };
}

/**
 * After the picker completes, Google's `mediaItems.list` occasionally returns []
 * briefly; retry a few times with backoff before giving up.
 */
export async function googlePhotosPickerList(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<{
  suggestions: PinPhotoSuggestion[];
}> {
  const delaysMs = [0, 450, 900, 1350];
  let lastSuggestions: PinPhotoSuggestion[] | undefined;
  let lastErr: Error | undefined;
  for (let i = 0; i < delaysMs.length; i++) {
    const wait = delaysMs[i]!;
    if (wait > 0)
      await new Promise((resolve) => {
        window.setTimeout(resolve, wait);
      });
    try {
      const r = await googlePhotosPickerListOnce(supabase, sessionId);
      lastSuggestions = r.suggestions;
      lastErr = undefined;
      if (lastSuggestions.length > 0) return { suggestions: lastSuggestions };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastErr && lastSuggestions === undefined) throw lastErr;
  return { suggestions: lastSuggestions ?? [] };
}

function parseDurationMs(d: string | undefined): number {
  if (!d) return 2000;
  const m = /^([\d.]+)s$/.exec(d.trim());
  if (m) return Math.max(500, Math.round(Number(m[1]) * 1000));
  return 2000;
}

/** Poll until the user finishes picking in Google Photos or the session expires. */
export async function googlePhotosWaitForPickerSelection(
  supabase: SupabaseClient,
  sessionId: string,
  expireTime: string | null,
  /** When set, poll faster after the picker tab closes (`/autoclose` on Done). */
  pickerWindow: Window | null = null,
): Promise<boolean> {
  const start = Date.now();
  const maxMs = 15 * 60 * 1000;
  /** Browsers may report `closed` briefly while the picker tab loads. */
  const trustClosedAfter = start + 1500;

  while (Date.now() - start < maxMs) {
    const s = await googlePhotosPickerSession(supabase, sessionId);
    if (s.mediaItemsSet === true) {
      await new Promise((r) => {
        window.setTimeout(r, 400);
      });
      return true;
    }

    const exp = expireTime ?? s.expireTime;
    if (exp && new Date(exp).getTime() < Date.now()) return false;

    const pickerClosed =
      pickerWindow != null &&
      pickerWindow.closed &&
      Date.now() >= trustClosedAfter;
    const intervalMs = pickerClosed
      ? 500
      : parseDurationMs(s.pollingConfig?.pollInterval);

    await new Promise((r) => {
      window.setTimeout(r, intervalMs);
    });
  }
  return false;
}

export type GooglePhotosImportResult = {
  importedIds: string[];
  skippedAlreadyOnPin: string[];
  downloadFailed: string[];
  storageFailed: string[];
};

const IMPORT_BATCH_SIZE = 3;

export async function googlePhotosImport(
  supabase: SupabaseClient,
  pinId: string,
  mediaItemIds: string[],
  pickerSessionId: string,
  options?: { finalizePickerSession?: boolean },
): Promise<GooglePhotosImportResult> {
  const { data, error } = await supabase.functions.invoke<{
    importedIds?: string[];
    skippedAlreadyOnPin?: string[];
    downloadFailed?: string[];
    storageFailed?: string[];
    error?: string;
    message?: string;
  }>("google-photos", {
    body: {
      action: "import",
      pinId,
      mediaItemIds,
      pickerSessionId,
      finalizePickerSession: options?.finalizePickerSession,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.message ?? data.error);
  return {
    importedIds: data?.importedIds ?? [],
    skippedAlreadyOnPin: data?.skippedAlreadyOnPin ?? [],
    downloadFailed: data?.downloadFailed ?? [],
    storageFailed: data?.storageFailed ?? [],
  };
}

/** Import in small batches so each edge request stays within local storage timeouts. */
export async function googlePhotosImportBatched(
  supabase: SupabaseClient,
  pinId: string,
  mediaItemIds: string[],
  pickerSessionId: string,
): Promise<GooglePhotosImportResult> {
  const merged: GooglePhotosImportResult = {
    importedIds: [],
    skippedAlreadyOnPin: [],
    downloadFailed: [],
    storageFailed: [],
  };
  if (mediaItemIds.length === 0) return merged;

  for (let i = 0; i < mediaItemIds.length; i += IMPORT_BATCH_SIZE) {
    const chunk = mediaItemIds.slice(i, i + IMPORT_BATCH_SIZE);
    const isLast = i + IMPORT_BATCH_SIZE >= mediaItemIds.length;
    const batch = await googlePhotosImport(
      supabase,
      pinId,
      chunk,
      pickerSessionId,
      { finalizePickerSession: isLast },
    );
    merged.importedIds.push(...batch.importedIds);
    merged.skippedAlreadyOnPin.push(...batch.skippedAlreadyOnPin);
    merged.downloadFailed.push(...batch.downloadFailed);
    merged.storageFailed.push(...batch.storageFailed);
  }
  return merged;
}
