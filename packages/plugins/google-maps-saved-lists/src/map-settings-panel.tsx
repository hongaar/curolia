import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { PluginSettingsBox, PluginStatusText } from "@curolia/ui/plugin-panel";
import { useState } from "react";
import { GoogleMapsMapImportWizard } from "./map-import-wizard";
import { useGoogleMapsMapImport } from "./use-google-maps-map-import";
import { buildMapSettingsStatus } from "./wizard-helpers";

export function GoogleMapsSavedListsMapSettingsPanel(
  props: MapSettingsPanelProps,
) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const state = useGoogleMapsMapImport({
    ...props,
    wizardOpen,
  });
  const {
    pluginGloballyEnabled,
    parsed,
    readOnly,
    linked,
    statusQuery,
    importButtonLabel,
  } = state;

  const statusLine = buildMapSettingsStatus({
    pluginGloballyEnabled,
    linked,
    hasExportCache: statusQuery.data?.hasExportCache === true,
    listCount: statusQuery.data?.listCount,
    lastExportAt: statusQuery.data?.lastExportAt,
    listDiscoveryJob: statusQuery.data?.listDiscoveryJob,
    importJob: statusQuery.data?.importJob,
    lastSyncAt: statusQuery.data?.lastSyncAt ?? parsed.lastSyncAt,
    lastSyncSummary:
      statusQuery.data?.lastSyncSummary ?? parsed.lastSyncSummary,
    importedListCount: state.importedListIds.length,
  });

  return (
    <>
      <PluginSettingsBox>
        {statusLine ? (
          <PluginStatusText size="sm">{statusLine}</PluginStatusText>
        ) : null}

        <Button
          type="button"
          disabled={readOnly || !pluginGloballyEnabled}
          onClick={() => setWizardOpen(true)}
        >
          {importButtonLabel}
        </Button>
      </PluginSettingsBox>

      <GoogleMapsMapImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        state={state}
      />
    </>
  );
}
