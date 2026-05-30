import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { linkDisplayDomain } from "@/lib/trace-links";
import { useTraceLinks } from "@/lib/use-trace-links";
import type { TraceLink } from "@/types/database";
import {
  TraceLinkExternalIcon,
  TraceLinkFavicon,
  TraceLinkRowBody,
  TraceLinkRowDomain,
  TraceLinkRowLink,
  TraceLinkRowTitle,
  TraceLinksListRoot,
} from "@curolia/ui/curolia/trace-links-ui";

type TraceLinksListProps = {
  traceId: string | undefined;
};

export function TraceLinksList({ traceId }: TraceLinksListProps) {
  const linksQuery = useTraceLinks(traceId);
  const links = linksQuery.data ?? [];
  if (links.length === 0) return null;
  return (
    <TraceLinksListRoot>
      {links.map((link) => (
        <li key={link.id}>
          <TraceLinkRow link={link} />
        </li>
      ))}
    </TraceLinksListRoot>
  );
}

type TraceLinkRowProps = {
  link: TraceLink;
};

export function TraceLinkRow({ link }: TraceLinkRowProps) {
  const domain = link.url ? linkDisplayDomain(link.url) : "";
  const title = (link.title ?? "").trim() || domain || link.url;
  return (
    <TraceLinkRowLink href={link.url}>
      <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
      <TraceLinkRowBody>
        <TraceLinkRowTitle>{title}</TraceLinkRowTitle>
        {domain ? <TraceLinkRowDomain>{domain}</TraceLinkRowDomain> : null}
      </TraceLinkRowBody>
      <TraceLinkExternalIcon />
    </TraceLinkRowLink>
  );
}

type LinkFaviconProps = {
  faviconUrl: string | null;
  domain: string;
};

export function LinkFavicon({ faviconUrl, domain }: LinkFaviconProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(faviconUrl) && !errored;
  return (
    <TraceLinkFavicon
      faviconUrl={showImage ? faviconUrl : null}
      domain={domain}
      onError={() => setErrored(true)}
    />
  );
}

export { Globe, ExternalLink };
