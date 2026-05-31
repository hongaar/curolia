import { PageBackButton } from "@/components/layout/page-back-button";
import { TraceDetailInsetMapView } from "@/components/traces/trace-detail-inset-map";
import { TraceFormDialogTrigger } from "@/components/traces/trace-form-dialog";
import { TraceLinksList } from "@/components/traces/trace-links-list";
import { TraceMetadataFooter } from "@/components/traces/trace-metadata-footer";
import { journalViewHref, mapHrefWithSearch } from "@/lib/app-paths";
import {
  applyMapCameraToSearchParams,
  applySelectedTraceToSearchParams,
  normalizeCameraForUrl,
  TRACE_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import { supabase } from "@/lib/supabase";
import { formatTraceDateRange } from "@/lib/trace-dates";
import {
  photoMasonrySource,
  photosToLightboxItems,
} from "@/lib/trace-photo-lightbox-items";
import { useTracePhotosSignedUrls } from "@/lib/use-trace-photos";
import { getPluginDefinition, pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import { useJournal } from "@/providers/journal-provider";
import type { Trace } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageCenteredError,
  PageCenteredLoading,
} from "@curolia/ui/page";
import {
  TraceDetailActions,
  TraceDetailCard,
  TraceDetailContent,
  TraceDetailDescription,
  TraceDetailHeader,
  TraceDetailSubtitle,
  TraceDetailTagBadge,
  TraceDetailTagRow,
  TraceDetailTitle,
} from "@curolia/ui/trace-detail";
import { TracePhotoLightbox } from "@curolia/ui/trace-photo-lightbox";
import { TracePhotoMasonry } from "@curolia/ui/trace-photo-masonry";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

type TraceRow = Trace & {
  trace_tags?: {
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    } | null;
  }[];
  creator?: { display_name: string | null } | null;
  modifier?: { display_name: string | null } | null;
};

export function TraceDetailPage() {
  const { journalSlug, traceSlug } = useParams<{
    journalSlug: string;
    traceSlug: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { journals, activeJournalId } = useJournal();
  const [photoLightbox, setPhotoLightbox] = useState<{
    photoId: string;
  } | null>(null);

  const journalForRoute = useMemo(
    () =>
      journals.find(
        (j) => j.slug.toLowerCase() === journalSlug?.trim().toLowerCase(),
      ) ?? null,
    [journals, journalSlug],
  );

  const traceQuery = useQuery({
    queryKey: ["trace", journalForRoute?.id, traceSlug],
    queryFn: async () => {
      if (!journalForRoute || !traceSlug?.trim()) return null;
      const slugNorm = traceSlug.trim().toLowerCase();
      const { data, error } = await supabase
        .from("traces")
        .select(
          `*,
          trace_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          creator:profiles!traces_created_by_user_id_fkey ( display_name ),
          modifier:profiles!traces_modified_by_user_id_fkey ( display_name )`,
        )
        .eq("journal_id", journalForRoute.id)
        .eq("slug", slugNorm)
        .maybeSingle();
      if (error) throw error;
      return data as TraceRow | null;
    },
    enabled: Boolean(journalForRoute && traceSlug?.trim()),
  });

  const traceIdResolved = traceQuery.data?.id;

  const {
    photos,
    signedUrlByPhotoId,
    isLoading: photosLoading,
  } = useTracePhotosSignedUrls(traceIdResolved);

  const trace = traceQuery.data;
  const wrongJournal =
    trace && activeJournalId && trace.journal_id !== activeJournalId;

  const tagBadges = useMemo(() => {
    const rows = trace?.trace_tags ?? [];
    return rows.map((tt) => tt.tags).filter(Boolean) as {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    }[];
  }, [trace]);

  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const masonryItems = useMemo(() => {
    const out: Parameters<typeof TracePhotoMasonry>[0]["items"] = [];
    for (const p of photos) {
      const url = signedUrlByPhotoId[p.id];
      if (!url) continue;
      const source = photoMasonrySource(p);
      let sourceIcon: ReactNode | undefined;
      let sourceLabel: string | undefined;
      if (source?.sourcePluginId) {
        const plugin = getPluginDefinition(source.sourcePluginId);
        if (plugin) {
          const Icon = plugin.icon;
          sourceIcon = <Icon size={5} />;
          sourceLabel = `Open in ${plugin.displayName}`;
        }
      }
      out.push({
        id: p.id,
        url,
        ...(source?.originalProductUrl
          ? { originalProductUrl: source.originalProductUrl }
          : {}),
        ...(sourceIcon ? { sourceIcon } : {}),
        ...(sourceLabel ? { sourceLabel } : {}),
        ...(sourceLabel
          ? { sourceTooltip: `${sourceLabel} — opens in a new tab` }
          : {}),
      });
    }
    return out;
  }, [photos, signedUrlByPhotoId]);

  const photoPlaceholders =
    photosLoading && photos.length > 0
      ? Math.max(0, photos.length - masonryItems.length)
      : 0;

  if (traceQuery.isLoading) {
    return <PageCenteredLoading>Loading trace…</PageCenteredLoading>;
  }

  if (!trace || wrongJournal) {
    return (
      <PageCenteredError
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const fromTrace =
                trace &&
                journals.find((x) => x.id === trace.journal_id)?.slug?.trim();
              const slug =
                fromTrace ||
                journals.find((x) => x.id === activeJournalId)?.slug?.trim();
              navigate(slug ? journalViewHref("map", slug) : "/");
            }}
          >
            Home
          </Button>
        }
      >
        Trace not found or not in this journal.
      </PageCenteredError>
    );
  }

  const traceDateSubtitle = formatTraceDateRange(trace.date, trace.end_date);

  const journalSlugForMap =
    journalForRoute?.slug?.trim() ?? journalSlug?.trim();
  const mapHref =
    journalSlugForMap != null && journalSlugForMap !== ""
      ? mapHrefWithSearch(
          journalSlugForMap,
          (() => {
            const withTrace = applySelectedTraceToSearchParams(
              new URLSearchParams(),
              trace.slug,
            );
            const params = applyMapCameraToSearchParams(
              withTrace,
              normalizeCameraForUrl({
                lat: trace.lat,
                lng: trace.lng,
                zoom: TRACE_FOCUS_ZOOM,
              }),
            );
            return `?${params.toString()}`;
          })(),
        )
      : null;

  const insetMarkerTag = tagBadges[0] ?? null;

  return (
    <AppPageLayout width="2xl">
      <PageBackButton />
      <TraceDetailCard>
        <TraceDetailHeader>
          <div>
            <TraceDetailTitle>
              {trace.title || "Untitled place"}
            </TraceDetailTitle>
            {traceDateSubtitle ? (
              <TraceDetailSubtitle>{traceDateSubtitle}</TraceDetailSubtitle>
            ) : null}
            <TraceDetailTagRow>
              {tagBadges.map((t) => (
                <TraceDetailTagBadge
                  key={t.id}
                  style={{
                    backgroundColor: t.color,
                    color: contrastingForeground(t.color),
                  }}
                >
                  {t.icon_emoji} {t.name}
                </TraceDetailTagBadge>
              ))}
            </TraceDetailTagRow>
          </div>
          <TraceDetailActions>
            <TraceFormDialogTrigger
              journalId={trace.journal_id}
              trace={trace}
              variant="outline"
              size="sm"
            />
          </TraceDetailActions>
        </TraceDetailHeader>
        <TraceDetailContent>
          {mapHref ? (
            <TraceDetailInsetMapView
              lng={trace.lng}
              lat={trace.lat}
              markerEmoji={insetMarkerTag?.icon_emoji ?? "📍"}
              markerColor={insetMarkerTag?.color ?? null}
              mapHref={mapHref}
              mapAriaLabel="Open this trace on the map"
            />
          ) : null}
          {trace.description ? (
            <TraceDetailDescription>{trace.description}</TraceDetailDescription>
          ) : null}
          {photos.length > 0 || photoPlaceholders > 0 ? (
            <TracePhotoMasonry
              items={masonryItems}
              loadingPlaceholders={photoPlaceholders}
              onOpen={(photoId) => setPhotoLightbox({ photoId })}
            />
          ) : null}
          <TraceLinksList traceId={trace.id} />
          {pluginList.map((p) => {
            const Section = p.TraceDetailSection;
            if (!Section) return null;
            return (
              <Section
                key={`detail-${p.id}`}
                supabase={supabase}
                userId={user?.id}
                traceId={trace.id}
                journalId={trace.journal_id}
                traceDate={trace.date}
                traceEndDate={trace.end_date}
              />
            );
          })}
          <TraceMetadataFooter
            createdAt={trace.created_at}
            updatedAt={trace.updated_at}
            creatorDisplayName={trace.creator?.display_name}
            modifierDisplayName={trace.modifier?.display_name}
          />
        </TraceDetailContent>
      </TraceDetailCard>
      <TracePhotoLightbox
        open={photoLightbox !== null}
        onOpenChange={(o) => {
          if (!o) setPhotoLightbox(null);
        }}
        items={lightboxItems}
        initialPhotoId={photoLightbox?.photoId ?? null}
        title={trace.title?.trim() || "Untitled place"}
      />
    </AppPageLayout>
  );
}
