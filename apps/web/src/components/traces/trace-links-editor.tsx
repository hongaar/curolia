import { useState } from "react";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  fetchLinkMetadata,
  linkDisplayDomain,
  normalizeUrlInput,
} from "@/lib/trace-links";
import { LinkFavicon } from "@/components/traces/trace-links-list";
import { useTraceLinks } from "@/lib/use-trace-links";
import type { TraceLink } from "@/types/database";
import { FormMutedText } from "@curolia/ui/curolia/form-layout";
import {
  TraceLinkRowBody,
  TraceLinkRowDomain,
  TraceLinkRowEditor,
  TraceLinkRowTitleLink,
  TraceLinksEditorAddRow,
  TraceLinksEditorList,
  TraceLinksEditorRoot,
  TraceLinksSpinnerIcon,
} from "@curolia/ui/curolia/trace-links-ui";

type TraceLinksEditorProps = {
  traceId: string;
  journalId: string;
};

export function TraceLinksEditor({
  traceId,
  journalId,
}: TraceLinksEditorProps) {
  const qc = useQueryClient();
  const [draftUrl, setDraftUrl] = useState("");
  const linksQuery = useTraceLinks(traceId);
  const links = linksQuery.data ?? [];

  const addMutation = useMutation({
    mutationFn: async (rawUrl: string) => {
      const normalized = normalizeUrlInput(rawUrl);
      if (!normalized) throw new Error("Enter a valid http(s) URL.");
      let title: string | null = null;
      let faviconUrl: string | null = null;
      let urlToStore = normalized;
      try {
        const meta = await fetchLinkMetadata(normalized);
        title = meta.title;
        faviconUrl = meta.faviconUrl;
        urlToStore = meta.finalUrl || normalized;
      } catch (e) {
        console.warn("link metadata fetch failed", e);
      }
      const sortOrder = links.reduce(
        (m, l) => Math.max(m, l.sort_order + 1),
        0,
      );
      const { error } = await supabase.from("trace_links").insert({
        journal_id: journalId,
        trace_id: traceId,
        url: urlToStore,
        title,
        favicon_url: faviconUrl,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setDraftUrl("");
      await qc.invalidateQueries({ queryKey: ["trace-links", traceId] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not add link.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trace_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["trace-links", traceId] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not remove link.");
    },
  });

  function submit() {
    const url = draftUrl.trim();
    if (!url) return;
    addMutation.mutate(url);
  }

  return (
    <TraceLinksEditorRoot>
      <TraceLinksEditorList>
        {links.map((link) => (
          <TraceLinkEditorRow
            key={link.id}
            link={link}
            onRemove={() => removeMutation.mutate(link.id)}
            removing={
              removeMutation.isPending && removeMutation.variables === link.id
            }
          />
        ))}
        {links.length === 0 ? (
          <FormMutedText>No links yet.</FormMutedText>
        ) : null}
      </TraceLinksEditorList>
      <TraceLinksEditorAddRow>
        <Input
          type="url"
          inputMode="url"
          placeholder="https://example.com/page"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={addMutation.isPending}
        />
        <Button
          type="button"
          variant="outline"
          onClick={submit}
          disabled={addMutation.isPending || draftUrl.trim().length === 0}
        >
          {addMutation.isPending ? <TraceLinksSpinnerIcon /> : null}
          Add
        </Button>
      </TraceLinksEditorAddRow>
    </TraceLinksEditorRoot>
  );
}

type TraceLinkEditorRowProps = {
  link: TraceLink;
  onRemove: () => void;
  removing: boolean;
};

function TraceLinkEditorRow({
  link,
  onRemove,
  removing,
}: TraceLinkEditorRowProps) {
  const domain = link.url ? linkDisplayDomain(link.url) : "";
  const title = (link.title ?? "").trim() || domain || link.url;
  return (
    <TraceLinkRowEditor>
      <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
      <TraceLinkRowBody>
        <TraceLinkRowTitleLink href={link.url} title={link.url}>
          {title}
        </TraceLinkRowTitleLink>
        {domain ? <TraceLinkRowDomain>{domain}</TraceLinkRowDomain> : null}
      </TraceLinkRowBody>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={removing}
        aria-label="Remove link"
      >
        <Trash2 aria-hidden />
      </Button>
    </TraceLinkRowEditor>
  );
}
