import { Button } from "@curolia/ui/button";
import {
  PluginPinArticlePreview,
  PluginPinError,
  PluginPinMuted,
  PluginPinSpinner,
} from "@curolia/ui/plugin-pin";
import { ExternalLink } from "lucide-react";
import type { WikidataPinPayload } from "./wikidata-pin-data";

export function WikidataEnrichmentBody({
  payload,
  busy,
  errorMessage,
  emptyMessage,
  hasPinTitle,
  hasPinDescription,
  onApplyPinSuggestion,
}: {
  payload: WikidataPinPayload | null;
  busy: boolean;
  errorMessage: string | null;
  emptyMessage: string;
  hasPinTitle?: boolean;
  hasPinDescription?: boolean;
  onApplyPinSuggestion?: (fields: {
    title?: string;
    description?: string;
  }) => void;
}) {
  const canSuggestTitle = Boolean(onApplyPinSuggestion && !hasPinTitle);
  const canSuggestDescription = Boolean(
    onApplyPinSuggestion && !hasPinDescription,
  );
  const showApplyActions = canSuggestTitle || canSuggestDescription;

  return (
    <>
      {busy ? <PluginPinSpinner /> : null}
      {errorMessage ? <PluginPinError>{errorMessage}</PluginPinError> : null}
      {!payload && !busy && !errorMessage ? (
        <PluginPinMuted>{emptyMessage}</PluginPinMuted>
      ) : null}
      {payload ? (
        <PluginPinArticlePreview
          title={payload.label}
          extract={payload.extract}
          thumbnailUrl={payload.thumbnailUrl}
          readMoreHref={payload.wikipediaUrl}
          readMoreIcon={<ExternalLink aria-hidden />}
          actions={
            showApplyActions ? (
              <>
                {canSuggestTitle ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onApplyPinSuggestion?.({ title: payload.label })
                    }
                  >
                    Use as title
                  </Button>
                ) : null}
                {canSuggestDescription ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onApplyPinSuggestion?.({
                        description: payload.extract,
                      })
                    }
                  >
                    Use as description
                  </Button>
                ) : null}
              </>
            ) : null
          }
        />
      ) : null}
    </>
  );
}
