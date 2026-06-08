import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { CheckList, CheckListOption } from "@curolia/ui/list";
import {
  PluginSettingsHint,
  PluginSettingsTitle,
  PluginStatusText,
} from "@curolia/ui/plugin-panel";
import { Stack } from "@curolia/ui/stack";
import { TaskProgress } from "@curolia/ui/task-progress";
import { WizardSteps, WizardStepsCaption } from "@curolia/ui/wizard-steps";
import { MapPin, Plus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { parsePolarstepsShareUrl, tripOptionId } from "./share-url";
import type { PolarstepsMapImportState } from "./use-polarsteps-map-import";
import {
  buildImportTaskProgress,
  tripListLabel,
  WIZARD_STEPS,
} from "./wizard-helpers";

export function PolarstepsMapImportWizard({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: PolarstepsMapImportState;
}) {
  const [step, setStep] = useState(0);
  const [shareUrlInput, setShareUrlInput] = useState("");
  const shareUrlId = useId();
  const tripsTitleId = useId();

  useEffect(() => {
    if (!open) {
      setStep(0);
      setShareUrlInput("");
    }
  }, [open]);

  const {
    readOnly,
    pluginGloballyEnabled,
    tripOptions,
    selectedTripIds,
    importedTripIdSet,
    toggleTripId,
    selectAllTrips,
    deselectAllTrips,
    busy,
    importInProgress,
    importJob,
    previewMut,
    importMut,
    selectedTrips,
    wizardImportResult,
    clearWizardImportResult,
  } = state;

  const currentStep = WIZARD_STEPS[step] ?? WIZARD_STEPS[0]!;
  const importStepComplete = Boolean(wizardImportResult);
  const importStepFailed =
    importJob?.status === "failed" && !importStepComplete;

  const canAddTrip =
    !readOnly &&
    pluginGloballyEnabled &&
    Boolean(parsePolarstepsShareUrl(shareUrlInput));

  const canImport =
    !readOnly &&
    pluginGloballyEnabled &&
    selectedTrips.length > 0 &&
    !importInProgress &&
    !busy;

  const handleImport = () => {
    clearWizardImportResult();
    void importMut.mutateAsync(selectedTrips);
  };

  const handleAddTrip = () => {
    const parsed = parsePolarstepsShareUrl(shareUrlInput);
    if (!parsed) return;
    void previewMut.mutateAsync(parsed.shareUrl).then(() => {
      setShareUrlInput("");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <Stack gap="md" align="stretch">
            <DialogTitle>Import from Polarsteps</DialogTitle>
            <WizardStepsCaption
              currentStep={step}
              totalSteps={WIZARD_STEPS.length}
              currentLabel={currentStep.title}
            />
            <WizardSteps
              steps={WIZARD_STEPS.map(({ id, title }) => ({
                id,
                label: title,
              }))}
              currentStep={step}
              aria-label="Polarsteps import wizard progress"
            />
          </Stack>
        </DialogHeader>

        <DialogBody>
          {currentStep.id === "trips" ? (
            <Stack gap="md" align="stretch">
              <div>
                <PluginSettingsTitle>
                  <Label htmlFor={shareUrlId}>Trip share link</Label>
                </PluginSettingsTitle>
                <PluginSettingsHint>
                  In the Polarsteps app or website, open your trip → Share →
                  copy the link. Private trips include a secret{" "}
                  <code>?s=…</code> parameter.
                </PluginSettingsHint>
              </div>
              <Stack gap="sm" direction="row" align="end">
                <Input
                  id={shareUrlId}
                  type="url"
                  placeholder="https://www.polarsteps.com/…/12345678-trip-name?s=…"
                  value={shareUrlInput}
                  disabled={readOnly || !pluginGloballyEnabled || busy}
                  onChange={(e) => setShareUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAddTrip) {
                      e.preventDefault();
                      handleAddTrip();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canAddTrip || previewMut.isPending}
                  onClick={handleAddTrip}
                >
                  <Plus />
                  Add trip
                </Button>
              </Stack>

              {!pluginGloballyEnabled ? (
                <PluginStatusText size="sm">
                  Turn on Polarsteps under Plugins in the user menu first.
                </PluginStatusText>
              ) : null}

              <PluginSettingsTitle id={tripsTitleId}>
                Trips to import
              </PluginSettingsTitle>

              {tripOptions.length === 0 ? (
                <PluginStatusText size="sm">
                  Added trips appear here. Paste a share link above to get
                  started.
                </PluginStatusText>
              ) : (
                <>
                  <Stack gap="sm" direction="row" justify="end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={readOnly || busy}
                      onClick={selectAllTrips}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={readOnly || busy}
                      onClick={deselectAllTrips}
                    >
                      Deselect all
                    </Button>
                  </Stack>
                  <CheckList
                    selected={selectedTripIds}
                    onToggle={toggleTripId}
                    disabled={readOnly || busy || importInProgress}
                    aria-labelledby={tripsTitleId}
                  >
                    {tripOptions.map((trip) => {
                      const id = tripOptionId(trip.tripId);
                      const alreadyImported = importedTripIdSet.has(
                        trip.tripId,
                      );
                      return (
                        <CheckListOption
                          key={id}
                          value={id}
                          label={tripListLabel(trip)}
                          disabled={alreadyImported}
                          description={
                            alreadyImported
                              ? "Already imported to this map"
                              : "Steps and photos will be copied to this map"
                          }
                          icon={<MapPin aria-hidden />}
                        />
                      );
                    })}
                  </CheckList>
                </>
              )}
            </Stack>
          ) : null}

          {currentStep.id === "import" ? (
            <>
              <PluginSettingsHint>
                Each Polarsteps step becomes a pin tagged with the trip name.
                Photos are stored in Curolia.
              </PluginSettingsHint>
              <TaskProgress
                {...buildImportTaskProgress({
                  importInProgress,
                  importMutPending: importMut.isPending,
                  importJob,
                  wizardImportResult,
                })}
              />
            </>
          ) : null}
        </DialogBody>

        <DialogFooter
          between={step > 0 || importStepComplete || importStepFailed}
        >
          {importStepComplete ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={readOnly}
                onClick={() => {
                  clearWizardImportResult();
                  setStep(0);
                }}
              >
                Import more trips
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </>
          ) : importStepFailed ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={readOnly}
                onClick={() => setStep(0)}
              >
                Choose other trips
              </Button>
              <Button
                type="button"
                disabled={readOnly || importMut.isPending}
                onClick={handleImport}
              >
                Try again
              </Button>
            </>
          ) : step === 0 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canImport}
                onClick={() => {
                  setStep(1);
                  handleImport();
                }}
              >
                Import to map
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={importInProgress}
              onClick={() => setStep(0)}
            >
              Back
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
