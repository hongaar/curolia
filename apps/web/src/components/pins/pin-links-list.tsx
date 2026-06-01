import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { linkDisplayDomain } from "@/lib/pin-links";
import { usePinLinks } from "@/lib/use-pin-links";
import type { PinLink } from "@/types/database";
import {
  PinLinkExternalIcon,
  PinLinkFavicon,
  PinLinkRowBody,
  PinLinkRowDomain,
  PinLinkRowLink,
  PinLinkRowTitle,
  PinLinksListRoot,
} from "@curolia/ui/pin-links";

type PinLinksListProps = {
  pinId: string | undefined;
};

export function PinLinksList({ pinId }: PinLinksListProps) {
  const linksQuery = usePinLinks(pinId);
  const links = linksQuery.data ?? [];
  if (links.length === 0) return null;
  return (
    <PinLinksListRoot>
      {links.map((link) => (
        <li key={link.id}>
          <PinLinkRow link={link} />
        </li>
      ))}
    </PinLinksListRoot>
  );
}

type PinLinkRowProps = {
  link: PinLink;
};

export function PinLinkRow({ link }: PinLinkRowProps) {
  const domain = link.url ? linkDisplayDomain(link.url) : "";
  const title = (link.title ?? "").trim() || domain || link.url;
  return (
    <PinLinkRowLink href={link.url}>
      <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
      <PinLinkRowBody>
        <PinLinkRowTitle>{title}</PinLinkRowTitle>
        {domain ? <PinLinkRowDomain>{domain}</PinLinkRowDomain> : null}
      </PinLinkRowBody>
      <PinLinkExternalIcon />
    </PinLinkRowLink>
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
    <PinLinkFavicon
      faviconUrl={showImage ? faviconUrl : null}
      domain={domain}
      onError={() => setErrored(true)}
    />
  );
}

export { Globe, ExternalLink };
