import { pinDetailHref } from "@/lib/app-paths";
import type { PublicMapOwnerProfile } from "@/lib/fetch-public-map";
import { mapRouteFromParts } from "@/lib/map-route";
import { formatPinDateRange } from "@/lib/pin-dates";
import type { Pin } from "@/types/database";
import {
  BlogAuthorCard,
  BlogContent,
  BlogEmptyPanel,
  BlogHeader,
  BlogLead,
  BlogPageRoot,
  BlogPinDate,
  BlogPinList,
  BlogPinTitle,
  BlogScroll,
  BlogTitle,
  blogStyles,
} from "@curolia/ui/blog";
import { MarkdownContentBody } from "@curolia/ui/markdown-content";
import { PageMuted } from "@curolia/ui/page";
import { renderToString } from "react-dom/server";

export type BlogPinSsrRow = Pick<
  Pin,
  "id" | "slug" | "title" | "description" | "date" | "end_date"
>;

export type BlogPageSsrProps = {
  mapName: string;
  mapRoute: { profileSlug: string; mapSlug: string };
  owner?: PublicMapOwnerProfile | null;
  pins: BlogPinSsrRow[];
};

function BlogOwnerSsr({ owner }: { owner: PublicMapOwnerProfile }) {
  return (
    <BlogAuthorCard
      avatar={
        owner.avatarUrl ? (
          <img
            src={owner.avatarUrl}
            alt=""
            width={40}
            height={40}
            decoding="async"
          />
        ) : (
          <span aria-hidden="true">{owner.displayName.slice(0, 1)}</span>
        )
      }
      name={owner.displayName}
      bio={owner.bio ?? undefined}
    />
  );
}

export function BlogPageSsrView({
  mapName,
  mapRoute,
  owner,
  pins,
}: BlogPageSsrProps) {
  const route = mapRouteFromParts(mapRoute.profileSlug, mapRoute.mapSlug);

  return (
    <BlogPageRoot>
      <BlogScroll>
        <BlogContent>
          <BlogHeader>
            <BlogTitle>{mapName}</BlogTitle>
            {owner ? <BlogOwnerSsr owner={owner} /> : null}
            <BlogLead>Pins are listed in chronological order.</BlogLead>
          </BlogHeader>

          {pins.length === 0 ? (
            <BlogEmptyPanel>
              <PageMuted>No pins yet.</PageMuted>
            </BlogEmptyPanel>
          ) : (
            <BlogPinList>
              {pins.map((pin) => {
                const title = pin.title?.trim() || "Untitled pin";
                const description = pin.description?.trim() ?? "";
                const detailHref = pinDetailHref(route, pin.slug);

                return (
                  <li key={pin.id}>
                    <article>
                      {pin.date ? (
                        <BlogPinDate dateTime={pin.date}>
                          {formatPinDateRange(pin.date, pin.end_date)}
                        </BlogPinDate>
                      ) : null}
                      <BlogPinTitle spaced={Boolean(pin.date)}>
                        <a
                          className={blogStyles.pinTitleLink}
                          href={detailHref}
                        >
                          {title}
                        </a>
                      </BlogPinTitle>
                      {description ? (
                        <MarkdownContentBody
                          className={blogStyles.pinDescription}
                          markdown={description}
                        />
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </BlogPinList>
          )}
        </BlogContent>
      </BlogScroll>
    </BlogPageRoot>
  );
}

export function renderBlogPageHtml(props: BlogPageSsrProps): string {
  return renderToString(<BlogPageSsrView {...props} />);
}
