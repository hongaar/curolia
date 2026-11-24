import { openApiDocument } from "@curolia/api/openapi";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  ApiEndpointDialog,
  type ApiEndpoint,
} from "../components/api-endpoint-dialog";
import {
  LegalList,
  LegalParagraph,
  LegalSection,
} from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";
import styles from "../styles/site.module.css";

const METHODS = ["get", "post", "patch", "put", "delete"] as const;

type Operation = { summary?: string; tags?: readonly string[] };

function Code({ children }: { children: ReactNode }) {
  return <code className={styles.devCode}>{children}</code>;
}

function endpointsByTag() {
  const groups = new Map<string, (ApiEndpoint & { summary: string })[]>();
  for (const [path, item] of Object.entries(openApiDocument.paths)) {
    const pathItem = item as Record<string, unknown>;
    for (const method of METHODS) {
      const op = pathItem[method] as Operation | undefined;
      if (!op) continue;
      const tag = op.tags?.[0] ?? "Other";
      const list = groups.get(tag) ?? [];
      list.push({
        method: method.toUpperCase(),
        path,
        summary: op.summary ?? "",
        operation: op as Record<string, unknown>,
        pathParameters: (pathItem.parameters as unknown[] | undefined) ?? [],
      });
      groups.set(tag, list);
    }
  }
  return openApiDocument.tags
    .map((t) => ({ ...t, endpoints: groups.get(t.name) ?? [] }))
    .filter((t) => t.endpoints.length);
}

export function DevelopersPageContent({
  logoSrc = "/icon.png",
  apiBaseUrl = "https://api.curolia.com",
  keysHref = "/developers/keys",
}: {
  logoSrc?: string;
  /** Base URL in front of `/v1` (differs per deployment). */
  apiBaseUrl?: string;
  /** Where signed-in users manage API keys. */
  keysHref?: string;
}) {
  const base = apiBaseUrl.replace(/\/+$/, "");
  const [selected, setSelected] = useState<ApiEndpoint | null>(null);
  return (
    <MarketingDocumentPage title="Curolia API" logoSrc={logoSrc}>
      <p className={styles.devNotice} role="note">
        <strong>Alpha.</strong> The v1 API is an early alpha. Endpoints, fields
        and behaviour may change or disappear at any time, without backwards
        compatibility or prior notice. Responses carry an{" "}
        <Code>X-API-Status: alpha</Code> header.
      </p>

      <LegalParagraph>
        The Curolia REST API lets you read and manage your profile, maps and
        pins from your own scripts and integrations. Plugin data can be included
        on maps and pins.
      </LegalParagraph>

      <LegalSection title="Getting started">
        <LegalList>
          <li>
            Create an API key on the{" "}
            <Link className={styles.legalInlineLink} to={keysHref}>
              API keys
            </Link>{" "}
            page (you need to be signed in). Keys with the <Code>read</Code>{" "}
            scope can only use <Code>GET</Code>; <Code>write</Code> is required
            for everything else.
          </li>
          <li>
            Send it as a bearer token:{" "}
            <Code>Authorization: Bearer cur_live_…</Code>. A key acts as your
            account, with exactly the access you have in the app.
          </li>
          <li>
            Base URL: <Code>{base}</Code>
          </li>
        </LegalList>
        <pre className={styles.devPre}>
          {`curl ${base}/v1/maps \\\n  -H "Authorization: Bearer $CUROLIA_API_KEY"`}
        </pre>
      </LegalSection>

      <LegalSection title="Conventions">
        <LegalList>
          <li>JSON request and response bodies with camelCase fields.</li>
          <li>
            Lists return <Code>{"{ data, nextCursor }"}</Code>. Pass{" "}
            <Code>cursor</Code> (and optionally <Code>limit</Code>, 1–200) to
            page through results.
          </li>
          <li>
            Errors return <Code>{"{ error: { code, message } }"}</Code> with
            status 400, 401, 403, 404, 405 or 409. Resources you cannot see
            return 404.
          </li>
          <li>
            Add <Code>?include=plugins</Code> to map and pin requests to include
            data from enabled plugins that expose it, keyed by plugin id.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Endpoints">
        <LegalParagraph>
          Select an endpoint for its parameters, request body and example
          responses.
        </LegalParagraph>
        {endpointsByTag().map((tag) => (
          <div key={tag.name} className={styles.devGroup}>
            <p className={styles.devGroupTitle}>
              <strong>{tag.name}</strong> — {tag.description}
            </p>
            <ul className={styles.devEndpoints}>
              {tag.endpoints.map((e) => (
                <li
                  key={`${e.method} ${e.path}`}
                  className={styles.devEndpoint}
                >
                  <button
                    type="button"
                    className={styles.devEndpointButton}
                    onClick={() => setSelected(e)}
                  >
                    <span className={styles.devMethod}>{e.method}</span>
                    <Code>{e.path}</Code>
                    <span className={styles.devSummary}>{e.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </LegalSection>

      <LegalSection title="OpenAPI">
        <LegalParagraph>
          The full schema, including request and response fields, is available
          as OpenAPI 3.1 at{" "}
          <a
            className={styles.legalInlineLink}
            href={`${base}/v1/openapi.json`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Code>{`${base}/v1/openapi.json`}</Code>
          </a>
          . No API key is required for it.
        </LegalParagraph>
      </LegalSection>
      <ApiEndpointDialog
        endpoint={selected}
        baseUrl={base}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </MarketingDocumentPage>
  );
}
