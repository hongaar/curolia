import type { MapSettingsPanelProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { PluginSettingsBox, PluginStatusText } from "@curolia/ui/plugin-panel";
import { useState } from "react";
import { PolarstepsMapImportWizard } from "./map-import-wizard";
import { usePolarstepsMapImport } from "./use-polarsteps-map-import";
import { buildMapSettingsStatus } from "./wizard-helpers";

export function PolarstepsMapSettingsPanel(props: MapSettingsPanelProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const state = usePolarstepsMapImport({
    ...props,
    wizardOpen,
  });
  const {
    pluginGloballyEnabled,
    parsed,
    readOnly,
    statusQuery,
    importButtonLabel,
    importedTripIds,
  } = state;

  const statusLine = buildMapSettingsStatus({
    pluginGloballyEnabled,
    tripCount: statusQuery.data?.trips?.length,
    lastSyncAt: statusQuery.data?.lastSyncAt ?? parsed.lastSyncAt,
    lastSyncSummary:
      statusQuery.data?.lastSyncSummary ?? parsed.lastSyncSummary,
    importJob: statusQuery.data?.importJob ?? parsed.importJob,
    importedTripCount: importedTripIds.length,
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

      <PolarstepsMapImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        state={state}
      />
    </>
  );
}
