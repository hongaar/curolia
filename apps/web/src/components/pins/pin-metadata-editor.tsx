import {
  DOG_POLICY_LABELS,
  emptyPinMetadataDraft,
  pinMetadataDraftError,
  pinMetadataDraftFromValue,
  pinMetadataValueFromDraft,
  pinMetadataValueSummary,
  WHEELCHAIR_LEVEL_LABELS,
  type PinMetadataDraft,
} from "@/lib/pin-metadata-edit";
import type { Json } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import {
  pinMetadataQueryKey,
  usePinMetadataRows,
} from "@/lib/use-pin-metadata";
import { pluginList } from "@/plugins/registry";
import {
  groupPinMetadataForDisplay,
  isPinMetadataEditableFieldKey,
  PIN_METADATA_EDITABLE_GROUPS,
  PIN_METADATA_MANUAL_SOURCE_ID,
  pinMetadataFieldLabel,
  type PinMetadataEditableFieldKey,
  type PinMetadataValueByKey,
} from "@curolia/plugin-contract";
import { FieldError } from "@curolia/ui/field";
import { FormSelectTriggerFull } from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
import {
  PinMetadataEditorAddMenu,
  PinMetadataEditorForm,
  PinMetadataEditorFormRow,
  PinMetadataEditorList,
  PinMetadataEditorRoot,
  PinMetadataEditorRow,
} from "@curolia/ui/pin-metadata-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@curolia/ui/select";
import { Textarea } from "@curolia/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PinMetadataEditorProps = {
  pinId: string;
  mapId: string;
};

type EditingState = {
  fieldKey: PinMetadataEditableFieldKey;
  draft: PinMetadataDraft;
  isNew: boolean;
  /** Show validation errors (after blur or a submit attempt). */
  touched: boolean;
};

type EditableItem = {
  fieldKey: PinMetadataEditableFieldKey;
  value: PinMetadataValueByKey[PinMetadataEditableFieldKey];
  sourcePluginId: string;
};

/** Pin form section: view, edit, remove, and add structured pin metadata. */
export function PinMetadataEditor({ pinId, mapId }: PinMetadataEditorProps) {
  const qc = useQueryClient();
  const rowsQuery = usePinMetadataRows(pinId);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const items = useMemo<EditableItem[]>(
    () =>
      groupPinMetadataForDisplay(rowsQuery.data ?? []).flatMap((item) =>
        isPinMetadataEditableFieldKey(item.fieldKey)
          ? [
              {
                fieldKey: item.fieldKey,
                value: item.value as EditableItem["value"],
                sourcePluginId: item.sourcePluginId,
              },
            ]
          : [],
      ),
    [rowsQuery.data],
  );

  const sourceLabelByPluginId = useMemo(
    () => new Map(pluginList.map((p) => [p.id, p.displayName])),
    [],
  );

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: pinMetadataQueryKey(pinId) });

  const saveMutation = useMutation({
    mutationFn: async ({
      fieldKey,
      value,
    }: {
      fieldKey: PinMetadataEditableFieldKey;
      value: EditableItem["value"];
    }) => {
      const { error } = await supabase.from("pin_metadata").upsert(
        {
          pin_id: pinId,
          map_id: mapId,
          field_key: fieldKey,
          source_plugin_id: PIN_METADATA_MANUAL_SOURCE_ID,
          value: value as Json,
        },
        { onConflict: "pin_id,field_key,source_plugin_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      setEditing(null);
      await invalidate();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not save detail.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (fieldKey: PinMetadataEditableFieldKey) => {
      const { error } = await supabase
        .from("pin_metadata")
        .delete()
        .eq("pin_id", pinId)
        .eq("field_key", fieldKey)
        .eq("source_plugin_id", PIN_METADATA_MANUAL_SOURCE_ID);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not remove detail.");
    },
  });

  const setFields = new Set(items.map((item) => item.fieldKey));
  const addGroups = PIN_METADATA_EDITABLE_GROUPS.map((group) => ({
    label: group.label,
    items: group.keys
      .filter(
        (key) =>
          !setFields.has(key) && !(editing?.isNew && editing.fieldKey === key),
      )
      .map((key) => ({ fieldKey: key, label: pinMetadataFieldLabel(key) })),
  }));

  function submit() {
    if (!editing) return;
    const value = pinMetadataValueFromDraft(editing.fieldKey, editing.draft);
    if (!value) {
      setEditing({ ...editing, touched: true });
      return;
    }
    saveMutation.mutate({ fieldKey: editing.fieldKey, value });
  }

  function renderForm(state: EditingState) {
    return (
      <PinMetadataEditorForm
        key={`form-${state.fieldKey}`}
        fieldKey={state.fieldKey}
        label={pinMetadataFieldLabel(state.fieldKey)}
        onSubmit={submit}
        onCancel={() => setEditing(null)}
        saving={saveMutation.isPending}
        submitDisabled={!state.draft.primary.trim()}
        submitLabel={state.isNew ? "Add" : "Save"}
      >
        <PinMetadataDraftFields
          fieldKey={state.fieldKey}
          draft={state.draft}
          error={
            state.touched
              ? pinMetadataDraftError(state.fieldKey, state.draft)
              : null
          }
          onChange={(draft) => setEditing({ ...state, draft })}
          onBlur={() => {
            if (!state.touched) setEditing({ ...state, touched: true });
          }}
        />
      </PinMetadataEditorForm>
    );
  }

  return (
    <PinMetadataEditorRoot>
      {items.length > 0 || editing?.isNew ? (
        <PinMetadataEditorList>
          {items.map((item) => {
            const locked =
              item.sourcePluginId !== PIN_METADATA_MANUAL_SOURCE_ID;
            return editing &&
              !editing.isNew &&
              editing.fieldKey === item.fieldKey ? (
              renderForm(editing)
            ) : (
              <PinMetadataEditorRow
                key={item.fieldKey}
                fieldKey={item.fieldKey}
                label={pinMetadataFieldLabel(item.fieldKey)}
                value={pinMetadataValueSummary(item.fieldKey, item.value)}
                source={
                  locked
                    ? (sourceLabelByPluginId.get(item.sourcePluginId) ??
                      item.sourcePluginId)
                    : undefined
                }
                onEdit={
                  locked
                    ? undefined
                    : () =>
                        setEditing({
                          fieldKey: item.fieldKey,
                          draft: pinMetadataDraftFromValue(
                            item.fieldKey,
                            item.value,
                          ),
                          isNew: false,
                          touched: false,
                        })
                }
                onRemove={
                  locked
                    ? undefined
                    : () => {
                        if (editing?.fieldKey === item.fieldKey) {
                          setEditing(null);
                        }
                        removeMutation.mutate(item.fieldKey);
                      }
                }
                removing={
                  removeMutation.isPending &&
                  removeMutation.variables === item.fieldKey
                }
              />
            );
          })}
          {editing?.isNew ? renderForm(editing) : null}
        </PinMetadataEditorList>
      ) : null}
      <PinMetadataEditorAddMenu
        groups={addGroups}
        disabled={saveMutation.isPending}
        onSelect={(fieldKey) => {
          if (!isPinMetadataEditableFieldKey(fieldKey)) return;
          setEditing({
            fieldKey,
            draft: emptyPinMetadataDraft(fieldKey),
            isNew: true,
            touched: false,
          });
        }}
      />
    </PinMetadataEditorRoot>
  );
}

function PinMetadataDraftFields({
  fieldKey,
  draft,
  error,
  onChange,
  onBlur,
}: {
  fieldKey: PinMetadataEditableFieldKey;
  draft: PinMetadataDraft;
  error: string | null;
  onChange: (draft: PinMetadataDraft) => void;
  onBlur: () => void;
}) {
  const fields = renderPinMetadataDraftInputs({
    fieldKey,
    draft,
    invalid: Boolean(error),
    onChange,
    onBlur,
  });
  return (
    <>
      {fields}
      {error ? <FieldError>{error}</FieldError> : null}
    </>
  );
}

function renderPinMetadataDraftInputs({
  fieldKey,
  draft,
  invalid,
  onChange,
  onBlur,
}: {
  fieldKey: PinMetadataEditableFieldKey;
  draft: PinMetadataDraft;
  invalid: boolean;
  onChange: (draft: PinMetadataDraft) => void;
  onBlur: () => void;
}) {
  const label = pinMetadataFieldLabel(fieldKey);
  const setPrimary = (primary: string) => onChange({ ...draft, primary });

  switch (fieldKey) {
    case "wheelchair_access":
    case "dog_policy": {
      const labels: Record<string, string> =
        fieldKey === "wheelchair_access"
          ? WHEELCHAIR_LEVEL_LABELS
          : DOG_POLICY_LABELS;
      return (
        <Select
          value={draft.primary}
          items={labels}
          onValueChange={(v) => {
            if (typeof v === "string") setPrimary(v);
          }}
        >
          <FormSelectTriggerFull aria-label={label}>
            <SelectValue />
          </FormSelectTriggerFull>
          <SelectContent>
            {Object.entries(labels).map(([value, text]) => (
              <SelectItem key={value} value={value}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "opening_hours":
      return (
        <Textarea
          aria-label={label}
          autoFocus
          rows={4}
          placeholder={"Mo-Fr 09:00-17:00\nSa 10:00-14:00"}
          value={draft.primary}
          onChange={(e) => setPrimary(e.target.value)}
        />
      );
    case "website":
      return (
        <PinMetadataEditorFormRow>
          <Input
            aria-label="Website URL"
            autoFocus
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            aria-invalid={invalid || undefined}
            value={draft.primary}
            onChange={(e) => setPrimary(e.target.value)}
            onBlur={onBlur}
          />
          <Input
            aria-label="Website label"
            placeholder="Label (optional)"
            value={draft.secondary}
            onChange={(e) => onChange({ ...draft, secondary: e.target.value })}
          />
        </PinMetadataEditorFormRow>
      );
    default:
      return (
        <Input
          aria-label={label}
          autoFocus
          type={
            fieldKey === "phone"
              ? "tel"
              : fieldKey === "email"
                ? "email"
                : "text"
          }
          placeholder={FIELD_PLACEHOLDERS[fieldKey]}
          aria-invalid={invalid || undefined}
          value={draft.primary}
          onChange={(e) => setPrimary(e.target.value)}
          onBlur={onBlur}
        />
      );
  }
}

const FIELD_PLACEHOLDERS: Partial<Record<PinMetadataEditableFieldKey, string>> =
  {
    place_type: "Café, museum, viewpoint…",
    cuisine: "Italian, Thai…",
    dietary_options: "Vegan, Gluten-free (comma separated)",
    phone: "+31 20 123 4567",
    email: "hello@example.com",
  };
