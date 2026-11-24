/** API error with a stable machine-readable `code`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") =>
  new ApiError(404, "not_found", `${what} not found`);

export const badRequest = (message: string) =>
  new ApiError(400, "invalid_request", message);

export const API_STATUS = "alpha";

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "X-API-Status": API_STATUS,
};

export function json(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: BASE_HEADERS,
  });
}

export function errorResponse(err: ApiError): Response {
  return json({ error: { code: err.code, message: err.message } }, err.status);
}

export function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, "Access-Control-Max-Age": "86400" },
  });
}

export async function readJsonBody(
  req: Request,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}
