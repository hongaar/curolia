import { exampleFor, resolveRef } from "@curolia/api/openapi";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import type * as React from "react";

import styles from "./api-endpoint-dialog.module.css";

type Node = Record<string, unknown>;

export type ApiEndpoint = {
  method: string;
  path: string;
  operation: Node;
  /** Path-level parameters shared by all methods. */
  pathParameters: readonly unknown[];
};

const json = (v: unknown) => JSON.stringify(v, null, 2);

function bodySchema(node: unknown): unknown {
  const content = resolveRef(node).content as Node | undefined;
  return (content?.["application/json"] as Node | undefined)?.schema;
}

function Pre({ children }: { children: React.ReactNode }) {
  return <pre className={styles.pre}>{children}</pre>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

function FieldTable({
  rows,
}: {
  rows: {
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }[];
}) {
  if (!rows.length) return null;
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>
              <code className={styles.code}>{r.name}</code>
              {r.required ? (
                <span className={styles.required}> required</span>
              ) : null}
            </td>
            <td className={styles.muted}>{r.type}</td>
            <td className={styles.muted}>{r.description ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function typeLabel(node: unknown): string {
  const s = resolveRef(node);
  const ref = (node as Node)?.$ref;
  if (typeof ref === "string") return ref.split("/").pop() ?? "object";
  const t = Array.isArray(s.type)
    ? s.type.join(" | ")
    : String(s.type ?? "any");
  if (Array.isArray(s.enum)) return s.enum.map((e) => `"${e}"`).join(" | ");
  return s.format ? `${t} (${s.format})` : t;
}

function schemaFields(node: unknown) {
  const s = resolveRef(node);
  const required = (s.required as string[] | undefined) ?? [];
  return Object.entries((s.properties ?? {}) as Node).map(([name, prop]) => ({
    name,
    type: typeLabel(prop),
    required: required.includes(name),
    description: resolveRef(prop).description as string | undefined,
  }));
}

function curlExample(e: ApiEndpoint, baseUrl: string, body: unknown): string {
  const path = e.path
    .replace("{mapId}", "6f1d2c3b-4a59-4e8f-9b7a-1c2d3e4f5a6b")
    .replace("{pinId}", "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d")
    .replace("{pluginId}", "poi");
  const lines = [
    `curl -X ${e.method} ${baseUrl}${path}`,
    `  -H "Authorization: Bearer $CUROLIA_API_KEY"`,
  ];
  if (body !== undefined) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${JSON.stringify(body)}'`);
  }
  return lines.join(" \\\n");
}

/** Request/response reference for one OpenAPI operation. */
export function ApiEndpointDialog({
  endpoint,
  baseUrl,
  onOpenChange,
}: {
  endpoint: ApiEndpoint | null;
  baseUrl: string;
  onOpenChange: (open: boolean) => void;
}) {
  const op = endpoint?.operation ?? {};
  const params = [
    ...(endpoint?.pathParameters ?? []),
    ...((op.parameters as unknown[] | undefined) ?? []),
  ].map((p) => resolveRef(p));
  const reqSchema = op.requestBody ? bodySchema(op.requestBody) : undefined;
  const reqExample = reqSchema ? exampleFor(reqSchema) : undefined;
  const responses = Object.entries((op.responses ?? {}) as Node);

  return (
    <Dialog open={endpoint !== null} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <DialogTitle>
            <span className={styles.method}>{endpoint?.method}</span>{" "}
            <code className={styles.code}>{endpoint?.path}</code>
          </DialogTitle>
          <DialogDescription>
            {String(op.summary ?? "")}
            {op.description ? ` — ${String(op.description)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {endpoint ? (
          <DialogBody>
            <Section title="Example request">
              <Pre>{curlExample(endpoint, baseUrl, reqExample)}</Pre>
            </Section>

            {params.length ? (
              <Section title="Parameters">
                <FieldTable
                  rows={params.map((p) => ({
                    name: `${String(p.name)} (${String(p.in)})`,
                    type: typeLabel(p.schema),
                    required: p.required === true,
                    description: p.description as string | undefined,
                  }))}
                />
              </Section>
            ) : null}

            {reqSchema ? (
              <Section title="Request body">
                <FieldTable rows={schemaFields(reqSchema)} />
                <Pre>{json(reqExample)}</Pre>
              </Section>
            ) : null}

            <Section title="Responses">
              {responses.map(([status, res]) => {
                const r = resolveRef(res);
                const schema = bodySchema(res);
                return (
                  <div key={status} className={styles.response}>
                    <p className={styles.responseHead}>
                      <code className={styles.code}>{status}</code>{" "}
                      <span className={styles.muted}>
                        {String(r.description ?? "")}
                      </span>
                    </p>
                    {schema && status.startsWith("2") ? (
                      <Pre>{json(exampleFor(schema))}</Pre>
                    ) : null}
                  </div>
                );
              })}
              <Pre>
                {json(exampleFor({ $ref: "#/components/schemas/Error" }))}
              </Pre>
            </Section>
          </DialogBody>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
