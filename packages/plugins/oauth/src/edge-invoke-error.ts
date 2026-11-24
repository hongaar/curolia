/**
 * `supabase.functions.invoke` reports non-2xx responses as a generic
 * "Edge Function returned a non-2xx status code" error with the `Response` on
 * `error.context`. Read the function's JSON `{ error, message }` body so users
 * see the actual reason (e.g. an expired Google link).
 */
export async function edgeInvokeError(error: unknown): Promise<Error> {
  const ctx = (error as { context?: unknown } | null)?.context;
  if (ctx instanceof Response) {
    try {
      const body = (await ctx.clone().json()) as {
        error?: unknown;
        message?: unknown;
      };
      if (typeof body.message === "string" && body.message) {
        return new Error(body.message);
      }
      if (typeof body.error === "string" && body.error) {
        return new Error(body.error);
      }
    } catch {
      /* not JSON */
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}
