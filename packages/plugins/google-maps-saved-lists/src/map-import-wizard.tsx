import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import { CheckList, CheckListOption } from "@curolia/ui/list";
import {
  PluginSettingsHint,
  PluginSettingsTitle,
  PluginStatusText,
} from "@curolia/ui/plugin-panel";
import { Stack } from "@curolia/ui/stack";
import { TaskProgress } from "@curolia/ui/task-progress";
import { WizardSteps, WizardStepsCaption } from "@curolia/ui/wizard-steps";
import { List, Star } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { GOOGLE_MAPS_STARRED_LIST_ID } from "./import-list-options";
import type { GoogleMapsMapImportState } from "./use-google-maps-map-import";
import {
  buildDownloadTaskProgress,
  buildImportTaskProgress,
  WIZARD_STEPS,
} from "./wizard-helpers";

function formatPlaceCount(count: number): string {
  return count === 1 ? "1 place" : `${count} places`;
}

export function GoogleMapsMapImportWizard({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: GoogleMapsMapImportState;
}) {
  const [step, setStep] = useState(0);
  const listsTitleId = useId();
  const initialStepRef = useRef(state.initialWizardStep);
  initialStepRef.current = state.initialWizardStep;

  useEffect(() => {
    if (!open) return;
    setStep(initialStepRef.current);
  }, [open]);

  const {
    readOnly,
    pluginGloballyEnabled,
    linked,
    selectedListIds,
    importedListIds,
    toggleListId,
    selectAllLists,
    deselectAllLists,
    importListOptions,
    busy,
    importInProgress,
    importJob,
    lastSyncAt,
    isOneTimeAccess,
    importMut,
    startDownloadMut,
    selectedSources,
    wizardImportResult,
    clearWizardImportResult,
    sourcesQuery,
    listDiscoveryJob,
    listDiscoveryActive,
    listDiscoveryFailed,
    hasExportCache,
    listCount,
    lastExportAt,
  } = state;

  const currentStep = WIZARD_STEPS[step] ?? WIZARD_STEPS[0];
  const importedListIdSet = new Set(importedListIds);
  const importableListOptions = importListOptions.filter(
    (option) => !importedListIdSet.has(option.id),
  );
  const allListsSelected =
    importableListOptions.length > 0 &&
    importableListOptions.every((option) => selectedListIds.has(option.id));
  const hasImportedLists = importedListIds.length > 0;

  const canAdvanceFromIntro = pluginGloballyEnabled && linked && !readOnly;
  const canAdvanceFromDownload =
    hasExportCache && !listDiscoveryActive && !listDiscoveryFailed;
  const canAdvanceFromLists = importListOptions.length > 0;

  const selectedPlaceCount = importListOptions
    .filter(
      (option) =>
        selectedListIds.has(option.id) && !importedListIdSet.has(option.id),
    )
    .reduce((sum, option) => sum + option.itemCount, 0);

  function formatListCount(count: number): string {
    return count === 1 ? "1 list" : `${count} lists`;
  }

  function handleIntroPrimary() {
    if (hasExportCache && !listDiscoveryFailed) {
      setStep(2);
      return;
    }
    if (!listDiscoveryActive) {
      startDownloadMut.mutate();
    }
    setStep(1);
  }

  function handleDownloadPrimary() {
    if (listDiscoveryFailed) {
      startDownloadMut.mutate();
      return;
    }
    setStep(2);
  }

  function handleListsPrimary() {
    if (selectedSources.length > 0) {
      handleImport();
    } else {
      clearWizardImportResult();
    }
    setStep(3);
  }

  function primaryActionLabel(): string {
    if (currentStep.id === "intro") {
      return hasExportCache && !listDiscoveryFailed
        ? "Choose lists"
        : "Start download";
    }
    if (currentStep.id === "download") {
      return listDiscoveryFailed ? "Try again" : "Continue";
    }
    if (currentStep.id === "lists") {
      const listTotal = selectedSources.length;
      if (listTotal === 0) return "Add to map";
      const listLabel = formatListCount(listTotal);
      const placeLabel = formatPlaceCount(selectedPlaceCount);
      return `Add ${listLabel} (${placeLabel})`;
    }
    return "Next";
  }

  function handlePrimaryAction() {
    if (currentStep.id === "intro") {
      handleIntroPrimary();
      return;
    }
    if (currentStep.id === "download") {
      handleDownloadPrimary();
      return;
    }
    if (currentStep.id === "lists") {
      handleListsPrimary();
    }
  }

  function isPrimaryDisabled(): boolean {
    if (readOnly) return true;
    if (currentStep.id === "intro") return !canAdvanceFromIntro;
    if (currentStep.id === "download") {
      if (listDiscoveryFailed) return busy;
      return !canAdvanceFromDownload || busy;
    }
    if (currentStep.id === "lists") {
      return !canAdvanceFromLists || busy || importInProgress;
    }
    return busy;
  }

  function handleBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleImport() {
    importMut.mutate();
  }

  function handleImportMore() {
    clearWizardImportResult();
    setStep(2);
  }

  const importStepComplete = wizardImportResult?.status === "completed";
  const importStepFailed = wizardImportResult?.status === "failed";
  const importStepSkipped =
    currentStep.id === "import" &&
    selectedSources.length === 0 &&
    !importInProgress &&
    !importMut.isPending &&
    !importStepFailed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide">
        <DialogHeader>
          <Stack gap="md" align="stretch">
            <DialogTitle>Import from Google Maps</DialogTitle>
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
              aria-label="Import wizard progress"
            />
          </Stack>
        </DialogHeader>

        <DialogBody>
          {currentStep.id === "intro" ? (
            <>
              <PluginStatusText size="sm">
                Curolia can copy places from your Google Maps saved lists into
                pins on this map. Each list becomes a tag so you can filter pins
                later—for example starred favorites, restaurants, or travel
                plans.
              </PluginStatusText>
              <PluginStatusText size="sm">
                Download your Google data once, then import one or more lists to
                any map. Places already on the map get the new list tag instead
                of being duplicated.
              </PluginStatusText>

              {!pluginGloballyEnabled ? (
                <PluginStatusText size="sm">
                  Turn on Google Maps under Plugins in the user menu, then link
                  your Google account.
                </PluginStatusText>
              ) : null}

              {pluginGloballyEnabled && !linked ? (
                <PluginStatusText size="sm">
                  Link Google Maps under Plugins before continuing.
                </PluginStatusText>
              ) : null}
            </>
          ) : null}

          {currentStep.id === "download" ? (
            <>
              <PluginSettingsTitle>
                Download your Google Maps data
              </PluginSettingsTitle>
              <PluginSettingsHint>
                Google builds ZIP archives through its Data Portability API.
                This usually takes 1–3 minutes. The download runs in the
                background—you can close this wizard and come back later.
              </PluginSettingsHint>

              <TaskProgress
                {...buildDownloadTaskProgress({
                  listDiscoveryJob,
                  listDiscoveryActive,
                  listDiscoveryFailed,
                  hasExportCache,
                  listCount,
                  lastExportAt,
                })}
              />
            </>
          ) : null}

          {currentStep.id === "lists" ? (
            <>
              <Stack gap="sm" align="stretch">
                <PluginSettingsTitle id={listsTitleId}>
                  Your Google Maps lists
                </PluginSettingsTitle>
                <PluginSettingsHint>
                  Starred places appear first. Select the lists you want to
                  import, or continue without importing any.
                  {hasImportedLists
                    ? " Lists already on this map are checked and cannot be selected again."
                    : null}
                </PluginSettingsHint>
                {importListOptions.length > 0 ? (
                  <Stack gap="sm" direction="row" justify="end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={readOnly || busy || allListsSelected}
                      onClick={selectAllLists}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={
                        readOnly ||
                        busy ||
                        importableListOptions.every(
                          (option) => !selectedListIds.has(option.id),
                        )
                      }
                      onClick={deselectAllLists}
                    >
                      Deselect all
                    </Button>
                  </Stack>
                ) : null}
              </Stack>

              {sourcesQuery.isError ? (
                <PluginStatusText size="sm">
                  {sourcesQuery.error instanceof Error
                    ? sourcesQuery.error.message
                    : "Could not load lists."}
                </PluginStatusText>
              ) : null}

              {importListOptions.length === 0 ? (
                <PluginStatusText size="sm">
                  No lists found. Go back and download your Google Maps data
                  first.
                </PluginStatusText>
              ) : (
                <CheckList
                  selected={selectedListIds}
                  onToggle={toggleListId}
                  disabled={readOnly || busy}
                  aria-labelledby={listsTitleId}
                >
                  {importListOptions.map((option) => {
                    const alreadyImported = importedListIdSet.has(option.id);
                    return (
                      <CheckListOption
                        key={option.id}
                        value={option.id}
                        label={option.label}
                        disabled={alreadyImported}
                        description={
                          alreadyImported
                            ? "Already imported to this map"
                            : option.id === GOOGLE_MAPS_STARRED_LIST_ID
                              ? "Your starred favorites on Google Maps"
                              : "Saved list from Google Maps"
                        }
                        meta={formatPlaceCount(option.itemCount)}
                        icon={
                          option.id === GOOGLE_MAPS_STARRED_LIST_ID ? (
                            <Star aria-hidden />
                          ) : (
                            <List aria-hidden />
                          )
                        }
                      />
                    );
                  })}
                </CheckList>
              )}
            </>
          ) : null}

          {currentStep.id === "import" ? (
            <>
              <TaskProgress
                {...buildImportTaskProgress({
                  importInProgress,
                  importMutPending: importMut.isPending,
                  importJob,
                  selectedSources,
                  selectedPlaceCount,
                  wizardImportResult,
                  lastSyncAt,
                })}
              />

              {isOneTimeAccess ? (
                <PluginStatusText size="sm">
                  Google granted one-time export access. Re-link under Plugins
                  after importing to download again on another account.
                </PluginStatusText>
              ) : null}
            </>
          ) : null}
        </DialogBody>

        <DialogFooter
          between={
            step > 0 ||
            importStepComplete ||
            importStepFailed ||
            importStepSkipped
          }
        >
          {importStepComplete ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={readOnly}
                onClick={handleImportMore}
              >
                Import more lists
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </>
          ) : importStepSkipped ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={readOnly}
                onClick={handleImportMore}
              >
                Choose lists
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
                onClick={handleImportMore}
              >
                Choose other lists
              </Button>
              <Button
                type="button"
                disabled={readOnly || importMut.isPending}
                onClick={handleImport}
              >
                Try again
              </Button>
            </>
          ) : (
            <>
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={readOnly || importInProgress || listDiscoveryActive}
                  onClick={handleBack}
                >
                  Back
                </Button>
              ) : null}

              {currentStep.id === "import" ? (
                importInProgress || importMut.isPending ? (
                  <Button type="button" disabled>
                    Importing…
                  </Button>
                ) : null
              ) : (
                <Button
                  type="button"
                  disabled={isPrimaryDisabled()}
                  onClick={handlePrimaryAction}
                >
                  {listDiscoveryActive && currentStep.id === "download"
                    ? "Downloading…"
                    : primaryActionLabel()}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
