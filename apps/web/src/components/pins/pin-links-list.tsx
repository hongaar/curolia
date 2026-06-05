import { useState } from "react";
import { linkDisplayDomain, linkDisplayTitle } from "@/lib/pin-links";
import { usePinLinks } from "@/lib/use-pin-links";
import type { PinLink } from "@/types/database";
import {
  PinLinkExternalIcon,
  PinLinkFavicon,
  PinLinkRowBody,
  PinLinkRowDescription,
  PinLinkRowDomain,
  PinLinkRowHeader,
  PinLinkRowLink,
  PinLinkRowPreview,
  PinLinkRowPreviewBody,
  PinLinkRowPreviewImage,
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
  const title = linkDisplayTitle(link);
  const description = (link.description ?? "").trim();
  const imageUrl = (link.image_url ?? "").trim();
  const hasPreview = Boolean(description || imageUrl);

  if (!hasPreview) {
    return (
      <PinLinkRowLink href={link.url} variant="compact">
        <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
        <PinLinkRowBody>
          <PinLinkRowTitle>{title}</PinLinkRowTitle>
          {domain ? <PinLinkRowDomain>{domain}</PinLinkRowDomain> : null}
        </PinLinkRowBody>
        <PinLinkExternalIcon />
      </PinLinkRowLink>
    );
  }

  return (
    <PinLinkRowLink href={link.url} variant="preview">
      <PinLinkRowPreview>
        {imageUrl ? <LinkPreviewImage imageUrl={imageUrl} /> : null}
        <PinLinkRowPreviewBody>
          <PinLinkRowHeader>
            <LinkFavicon faviconUrl={link.favicon_url} domain={domain} />
            <PinLinkRowBody>
              <PinLinkRowTitle>{title}</PinLinkRowTitle>
              {domain ? <PinLinkRowDomain>{domain}</PinLinkRowDomain> : null}
            </PinLinkRowBody>
          </PinLinkRowHeader>
          {description ? (
            <PinLinkRowDescription>{description}</PinLinkRowDescription>
          ) : null}
        </PinLinkRowPreviewBody>
      </PinLinkRowPreview>
      <PinLinkExternalIcon />
    </PinLinkRowLink>
  );
}

type LinkPreviewImageProps = {
  imageUrl: string;
};

function LinkPreviewImage({ imageUrl }: LinkPreviewImageProps) {
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    <PinLinkRowPreviewImage src={imageUrl} onError={() => setErrored(true)} />
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
