import {
  formatPinMetadataTimestamp,
  pinWasModifiedAfterCreate,
} from "@/lib/pin-dates";
import { PinMetadataFooter as UiPinMetadataFooter } from "@curolia/ui/pin-metadata-footer";

type PinMetadataFooterProps = {
  createdAt: string;
  updatedAt: string;
  creatorDisplayName: string | null | undefined;
  modifierDisplayName: string | null | undefined;
};

export function PinMetadataFooter({
  createdAt,
  updatedAt,
  creatorDisplayName,
  modifierDisplayName,
}: PinMetadataFooterProps) {
  const byCreator = creatorDisplayName?.trim();
  const byModifier = modifierDisplayName?.trim();
  const showModified = pinWasModifiedAfterCreate(createdAt, updatedAt);

  return (
    <UiPinMetadataFooter
      createdLine={
        <>
          Created {formatPinMetadataTimestamp(createdAt)}
          {byCreator ? ` by ${byCreator}` : null}
        </>
      }
      modifiedLine={
        showModified ? (
          <>
            Modified {formatPinMetadataTimestamp(updatedAt)}
            {byModifier ? ` by ${byModifier}` : null}
          </>
        ) : undefined
      }
    />
  );
}
