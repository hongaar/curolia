export type Params = Record<string, string>;
export type Handler<C> = (ctx: C, params: Params) => Promise<Response>;

type Route<C> = { method: string; parts: string[]; handler: Handler<C> };

/** Minimal path router (`/v1/maps/:mapId`); host- and mount-agnostic. */
export class Router<C> {
  private routes: Route<C>[] = [];

  on(method: string, path: string, handler: Handler<C>): this {
    this.routes.push({
      method,
      parts: path.split("/").filter(Boolean),
      handler,
    });
    return this;
  }

  match(
    method: string,
    path: string,
  ): { handler: Handler<C>; params: Params } | "method_not_allowed" | null {
    const segs = path.split("/").filter(Boolean);
    let pathMatched = false;
    for (const r of this.routes) {
      if (r.parts.length !== segs.length) continue;
      const params: Params = {};
      const ok = r.parts.every((p, i) => {
        if (p.startsWith(":")) {
          params[p.slice(1)] = decodeURIComponent(segs[i]!);
          return true;
        }
        return p === segs[i];
      });
      if (!ok) continue;
      pathMatched = true;
      if (r.method === method) return { handler: r.handler, params };
    }
    return pathMatched ? "method_not_allowed" : null;
  }
}
