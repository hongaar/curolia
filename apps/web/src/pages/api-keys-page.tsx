import { PageBackButton } from "@/components/layout/page-back-button";
import {
  useApiKeyMutations,
  useApiKeys,
  type ApiKeyScope,
} from "@/lib/api-keys";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { CautionPanel } from "@curolia/ui/caution-panel";
import { Checkbox } from "@curolia/ui/checkbox";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  FormActions,
  FormSection,
} from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import {
  BorderedList,
  ListEmptyItem,
  MemberActions,
  MemberListRow,
  MemberPrimary,
  MemberRole,
} from "@curolia/ui/list";
import {
  AppPageLayout,
  PageFormBlockSpaced,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PagePanel,
  PageSectionSubheading,
} from "@curolia/ui/page";
import { SecretReveal } from "@curolia/ui/secret-reveal";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function ScopeCheckbox({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Label>
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      {label}
    </Label>
  );
}

export function ApiKeysPage() {
  const { user } = useAuth();
  const keysQuery = useApiKeys(user?.id);
  const { create, revoke } = useApiKeyMutations(user?.id);
  const [name, setName] = useState("");
  const [write, setWrite] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function onCreate() {
    setCreating(true);
    try {
      const scopes: ApiKeyScope[] = write ? ["read", "write"] : ["read"];
      setNewKey(await create(name.trim(), scopes));
      setName("");
      setWrite(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create key");
    } finally {
      setCreating(false);
    }
  }

  async function onRevoke(id: string, keyName: string) {
    if (!window.confirm(`Revoke "${keyName}"? Apps using it stop working.`)) {
      return;
    }
    try {
      await revoke(id);
      toast.success("API key revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke key");
    }
  }

  const keys = keysQuery.data ?? [];

  return (
    <AppPageLayout toolbar={<PageBackButton />}>
      <PagePanel>
        <PageHeader>
          <PageHeaderTitle>API keys</PageHeaderTitle>
          <PageHeaderLead>
            Use the Curolia REST API with your profile, maps and pins.{" "}
            <Link to="/developers">Read the API docs</Link>.
          </PageHeaderLead>
        </PageHeader>

        <PageFormBlockSpaced>
          <CautionPanel
            title="Alpha API"
            description="The v1 API may change at any time, without backwards compatibility or notice. Keys act as your account; keep them secret."
          />

          {newKey ? (
            <FormSection>
              <Field>
                <FieldLabel>New API key</FieldLabel>
                <FieldControl>
                  <SecretReveal
                    value={newKey}
                    label="New API key"
                    hint="Copy this key now. You won't be able to see it again."
                  />
                </FieldControl>
              </Field>
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setNewKey(null)}
                >
                  Done
                </Button>
              </FormActions>
            </FormSection>
          ) : null}

          <FormSection>
            <PageSectionSubheading>Create a key</PageSectionSubheading>
            <Field>
              <FieldLabel htmlFor="api-key-name">Name</FieldLabel>
              <FieldControl>
                <Input
                  id="api-key-name"
                  value={name}
                  maxLength={100}
                  placeholder="e.g. Home Assistant"
                  onChange={(e) => setName(e.target.value)}
                />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Access</FieldLabel>
              <FieldDescription>
                Read is always included. Write allows creating, changing and
                deleting maps and pins.
              </FieldDescription>
              <FieldControl>
                <PageInlineActions spaced="none">
                  <ScopeCheckbox
                    label="Write"
                    checked={write}
                    onCheckedChange={setWrite}
                  />
                </PageInlineActions>
              </FieldControl>
            </Field>
            <FormActions>
              <Button
                type="button"
                size="sm"
                disabled={!name.trim() || creating}
                onClick={() => void onCreate()}
              >
                Create API key
              </Button>
            </FormActions>
          </FormSection>

          <FormSection>
            <PageSectionSubheading>Your keys</PageSectionSubheading>
            <BorderedList>
              {keysQuery.isLoading ? (
                <ListEmptyItem>Loading…</ListEmptyItem>
              ) : keys.length === 0 ? (
                <ListEmptyItem>No API keys yet.</ListEmptyItem>
              ) : (
                keys.map((k) => (
                  <MemberListRow key={k.id}>
                    <MemberPrimary
                      secondary={`${k.prefix}… · created ${dateFormat.format(new Date(k.created_at))} · ${
                        k.last_used_at
                          ? `last used ${dateFormat.format(new Date(k.last_used_at))}`
                          : "never used"
                      }`}
                    >
                      {k.name}
                    </MemberPrimary>
                    <MemberRole>
                      {k.scopes.includes("write") ? "Read & write" : "Read"}
                    </MemberRole>
                    <MemberActions>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void onRevoke(k.id, k.name)}
                      >
                        Revoke
                      </Button>
                    </MemberActions>
                  </MemberListRow>
                ))
              )}
            </BorderedList>
          </FormSection>
        </PageFormBlockSpaced>
      </PagePanel>
    </AppPageLayout>
  );
}
