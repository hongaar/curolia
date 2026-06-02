import { LinkFavicon } from "@/components/pins/pin-links-list";
import { linkDisplayDomain } from "@/lib/pin-links";
import { supabase } from "@/lib/supabase";
import { useAddPinLink } from "@/lib/use-add-pin-link";
import { usePinLinks } from "@/lib/use-pin-links";
import type { PinLink } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import {
  PinLinkRowBody,
  PinLinkRowDomain,
  PinLinkRowEditor,
  PinLinkRowTitleLink,
  PinLinksEditorAddRow,
  PinLinksEditorList,
  PinLinksEditorRoot,
  PinLinksSpinnerIcon,
} from "@curolia/ui/pin-links";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PinLinksEditorProps = {
  pinId: string;
  mapId: string;
};

export function PinLinksEditor({ pinId, mapId }: PinLinksEditorProps) {
  const qc = useQueryClient();
  const [draftUrl, setDraftUrl] = useState("");
  const linksQuery = usePinLinks(pinId);
  const links = linksQuery.data ?? [];

  const addMutation = useAddPinLink(pinId, mapId);

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pin_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pin-links", pinId] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not remove link.");
    },
  });

  function submit() {
    const url = draftUrl.trim();
    if (!url) return;
    addMutation.mutate(url, {
      onSuccess: () => setDraftUrl(""),
    });
  }

  return (
    <PinLinksEditorRoot>
      {links.length > 0 ? (
        <PinLinksEditorList>
          {links.map((link) => (
            <PinLinkEditorRow
              key={link.id}
              link={link}
              onRemove={() => removeMutation.mutate(link.id)}
              removing={
                removeMutation.isPending && removeMutation.variables === link.id
              }
            />
          ))}
        </PinLinksEditorList>
      ) : null}
      <PinLinksEditorAddRow>
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
          {addMutation.isPending ? <PinLinksSpinnerIcon /> : null}
          Add
        </Button>
      </PinLinksEditorAddRow>
    </PinLinksEditorRoot>
  );
}

type PinLinkEditorRowProps = {
  link: PinLink;
  onRemove: () => void;
  removing: boolean;
};

function PinLinkEditorRow({ link, onRemove, removing }: PinLinkEditorRowProps) {
  const domain = link.url ? linkDisplayDomain(link.url) : "";
  const title = (link.title ?? "").trim() || domain || link.url;
  return (
    <PinLinkRowEditor>
      <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
      <PinLinkRowBody>
        <PinLinkRowTitleLink href={link.url} title={link.url}>
          {title}
        </PinLinkRowTitleLink>
        {domain ? <PinLinkRowDomain>{domain}</PinLinkRowDomain> : null}
      </PinLinkRowBody>
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
    </PinLinkRowEditor>
  );
}
