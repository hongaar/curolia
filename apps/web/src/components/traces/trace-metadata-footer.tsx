import {
  formatTraceMetadataTimestamp,
  traceWasModifiedAfterCreate,
} from "@/lib/trace-dates";
import { TraceMetadataFooter as UiTraceMetadataFooter } from "@curolia/ui/trace-metadata-footer";

type TraceMetadataFooterProps = {
  createdAt: string;
  updatedAt: string;
  creatorDisplayName: string | null | undefined;
  modifierDisplayName: string | null | undefined;
};

export function TraceMetadataFooter({
  createdAt,
  updatedAt,
  creatorDisplayName,
  modifierDisplayName,
}: TraceMetadataFooterProps) {
  const byCreator = creatorDisplayName?.trim();
  const byModifier = modifierDisplayName?.trim();
  const showModified = traceWasModifiedAfterCreate(createdAt, updatedAt);

  return (
    <UiTraceMetadataFooter
      createdLine={
        <>
          Created {formatTraceMetadataTimestamp(createdAt)}
          {byCreator ? ` by ${byCreator}` : null}
        </>
      }
      modifiedLine={
        showModified ? (
          <>
            Modified {formatTraceMetadataTimestamp(updatedAt)}
            {byModifier ? ` by ${byModifier}` : null}
          </>
        ) : undefined
      }
    />
  );
}
