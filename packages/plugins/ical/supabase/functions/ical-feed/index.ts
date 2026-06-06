import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type PinRow = {
  id: string;
  title: string | null;
  description: string | null;
  lat: number;
  lng: number;
  date: string | null;
  end_date: string | null;
};

function escapeIcsText(s: string): string {
  return s
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}

/** Fold to ~75 octets per RFC 5545 (ASCII-safe for our charset). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  if (rest.length) parts.push(rest);
  return parts.join("\r\n");
}

function ymdToIcsDate(ymd: string): string {
  return ymd.replaceAll("-", "");
}

/** Exclusive calendar end for VALUE=DATE (day after inclusive last day). */
function exclusiveEndFromInclusive(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d + 1);
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function formatUtcDtStamp(d: Date): string {
  return (
    d.toISOString().replaceAll("-", "").replaceAll(":", "").split(".")[0] + "Z"
  );
}

function buildCalendar(params: {
  mapName: string;
  mapId: string;
  pins: PinRow[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Curolia//iCalendar feed//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(params.mapName)}`,
  ];
  const dtstamp = formatUtcDtStamp(new Date());
  for (const t of params.pins) {
    if (!t.date) continue;
    const summary = (t.title?.trim() || "Pin").slice(0, 200);
    const desc = t.description?.trim() ?? "";
    const start = ymdToIcsDate(t.date);
    const lastInclusive =
      t.end_date && t.end_date >= t.date ? t.end_date : t.date;
    const endExclusive = exclusiveEndFromInclusive(lastInclusive);
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${t.id}@curolia-${params.mapId}`));
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${endExclusive}`);
    lines.push(foldLine(`SUMMARY:${escapeIcsText(summary)}`));
    if (desc.length > 0)
      lines.push(foldLine(`DESCRIPTION:${escapeIcsText(desc)}`));
    lines.push(foldLine(`GEO:${t.lat};${t.lng}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: pluginRow, error: pluginErr } = await admin
    .from("map_plugins")
    .select("map_id, config")
    .eq("plugin_type_id", "ical")
    .filter("config->>feedToken", "eq", token)
    .maybeSingle();

  if (pluginErr || !pluginRow?.map_id) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const mapId = pluginRow.map_id as string;
  const cfg = pluginRow.config as Record<string, unknown> | null;
  const publish = cfg?.publishFeed === true;
  if (!publish) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: ownerRow, error: ownerErr } = await admin
    .from("map_members")
    .select("user_id")
    .eq("map_id", mapId)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerErr || !ownerRow?.user_id) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: uc, error: ucErr } = await admin
    .from("user_plugins")
    .select("enabled")
    .eq("user_id", ownerRow.user_id as string)
    .eq("plugin_type_id", "ical")
    .maybeSingle();

  if (ucErr || !uc?.enabled) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: map, error: jErr } = await admin
    .from("maps")
    .select("name")
    .eq("id", mapId)
    .single();
  if (jErr || !map) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: pins, error: tErr } = await admin
    .from("pins")
    .select("id, title, description, lat, lng, date, end_date")
    .eq("map_id", mapId)
    .order("date", { ascending: true, nullsFirst: false });

  if (tErr) {
    return new Response("Error", {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const body = buildCalendar({
    mapName: (map.name as string) || "Untitled map",
    mapId,
    pins: (pins ?? []) as PinRow[],
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
