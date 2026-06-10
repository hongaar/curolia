import { formatPinDateRange } from "@/lib/pin-dates";
import {
  pinLocationLabel,
  type PinLocationLabelSource,
} from "@curolia/services/geocoding";
import { MarkdownContentBody } from "@curolia/ui/markdown-content";
import { PagePanel } from "@curolia/ui/page";
import {
  PinDetailContent,
  PinDetailHeader,
  PinDetailSubtitleStack,
  PinDetailTitle,
} from "@curolia/ui/pin-detail";
import { renderToString } from "react-dom/server";

export type PinPageSsrProps = {
  mapName: string;
  pin: PinLocationLabelSource & {
    title: string | null;
    description: string | null;
    date: string | null;
    end_date: string | null;
  };
};

export function PinPageSsrView({ mapName, pin }: PinPageSsrProps) {
  const title = pin.title?.trim() || "Untitled place";
  const description = pin.description?.trim() ?? "";
  const dateLabel = pin.date
    ? formatPinDateRange(pin.date, pin.end_date)
    : null;
  const location = pinLocationLabel(pin);

  return (
    <PagePanel>
      <PinDetailHeader>
        <p>On map: {mapName}</p>
        <PinDetailTitle>{title}</PinDetailTitle>
        <PinDetailSubtitleStack
          rows={[
            dateLabel ? (
              <time dateTime={pin.date ?? undefined}>{dateLabel}</time>
            ) : null,
            location,
          ]}
        />
      </PinDetailHeader>
      {description ? (
        <PinDetailContent>
          <MarkdownContentBody markdown={description} />
        </PinDetailContent>
      ) : null}
    </PagePanel>
  );
}

export function renderPinPageHtml(props: PinPageSsrProps): string {
  return renderToString(<PinPageSsrView {...props} />);
}
