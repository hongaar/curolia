import { UserAvatar } from "@/components/user-avatar";
import { mapViewHref } from "@/lib/app-paths";
import {
  inviteRoleSelectLabel,
  mapRoleLabel,
  type InviteMapRole,
} from "@/lib/map-member-roles";
import { mapRouteForMap } from "@/lib/map-route";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import type { MapInvitation, MapMemberRole, Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import { CautionPanel } from "@curolia/ui/caution-panel";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  FormSelectTriggerCompact,
  FormSelectTriggerInvite,
} from "@curolia/ui/form-layout";
import { Input } from "@curolia/ui/input";
import {
  BorderedList,
  ListEmptyItem,
  MemberActions,
  MemberAvatar,
  MemberListRow,
  MemberPrimary,
  MemberRole,
} from "@curolia/ui/list";
import {
  PageErrorText,
  PageInviteEmailField,
  PageInviteRoleField,
  PageInviteRow,
  PageSectionHeading,
  PageSectionHint,
  PageSectionSubheading,
  PageSharingRoot,
  PageSharingSection,
} from "@curolia/ui/page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@curolia/ui/select";
import { Switch } from "@curolia/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type MemberRow = {
  user_id: string;
  role: MapMemberRole;
  profile: Profile | null;
};

export function MapSharingSection({
  mapId,
  mapName,
  ownerProfileSlug,
  mapSlug,
  isPublic,
  isOwner,
}: {
  mapId: string;
  mapName: string;
  ownerProfileSlug: string;
  mapSlug: string;
  isPublic: boolean;
  isOwner: boolean;
}) {
  const { user } = useAuth();
  const { maps, setActiveMapId } = useMap();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteMapRole>("viewer");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferErr, setTransferErr] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState(null as string | null);
  const [publicBusy, setPublicBusy] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["map_members_detail", mapId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("map_members")
        .select("user_id, role")
        .eq("map_id", mapId);
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [] as MemberRow[];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      if (pErr) throw pErr;
      const byId = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));
      return (rows ?? []).map((r) => ({
        user_id: r.user_id,
        role: r.role as MapMemberRole,
        profile: byId.get(r.user_id) ?? null,
      }));
    },
    enabled: Boolean(mapId),
  });

  const invitationsQuery = useQuery({
    queryKey: ["map_invitations", mapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("map_invitations")
        .select("*")
        .eq("map_id", mapId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MapInvitation[];
    },
    enabled: Boolean(mapId && isOwner),
  });

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const pendingInvites = invitationsQuery.data ?? [];
  const trimmedProfileSlug = ownerProfileSlug.trim();
  const trimmedSlug = mapSlug.trim();
  const publicMapUrl =
    trimmedProfileSlug && trimmedSlug && typeof window !== "undefined"
      ? `${window.location.origin}${mapViewHref("map", {
          profileSlug: trimmedProfileSlug,
          mapSlug: trimmedSlug,
        })}`
      : null;

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviteBusy(true);
    setInviteErr(null);
    const { data, error } = await supabase.rpc("invite_map_member", {
      p_map_id: mapId,
      p_invitee_email: inviteEmail.trim(),
      p_invited_role: inviteRole,
    });
    setInviteBusy(false);
    if (error) {
      setInviteErr(error.message);
      return;
    }
    if (data) {
      void qc.invalidateQueries({
        queryKey: ["map_invitations", mapId],
      });
      void qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      void qc.invalidateQueries({
        queryKey: ["notifications_unread", user?.id],
      });
      setInviteEmail("");
    }
  }

  async function cancelInvite(id: string) {
    const { error } = await supabase.rpc("cancel_map_invitation", {
      p_invitation_id: id,
    });
    if (error) {
      setInviteErr(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["map_invitations", mapId] });
  }

  async function removeMember(uid: string) {
    const { error } = await supabase.rpc("remove_map_member", {
      p_map_id: mapId,
      p_user_id: uid,
    });
    if (error) {
      setInviteErr(error.message);
      return;
    }
    void qc.invalidateQueries({
      queryKey: ["map_members_detail", mapId],
    });
  }

  async function changeRole(uid: string, role: MapMemberRole) {
    if (role === "owner") return;
    const { error } = await supabase.rpc("update_map_member_role", {
      p_map_id: mapId,
      p_user_id: uid,
      p_role: role,
    });
    if (error) {
      setInviteErr(error.message);
      return;
    }
    void qc.invalidateQueries({
      queryKey: ["map_members_detail", mapId],
    });
  }

  async function runTransfer() {
    if (!transferEmail.trim()) return;
    setTransferBusy(true);
    setTransferErr(null);
    const { error } = await supabase.rpc("transfer_map_ownership_by_email", {
      p_map_id: mapId,
      p_new_owner_email: transferEmail.trim(),
    });
    setTransferBusy(false);
    if (error) {
      setTransferErr(error.message);
      return;
    }
    setTransferOpen(false);
    setTransferEmail("");
    void qc.invalidateQueries({
      queryKey: ["map_members_detail", mapId],
    });
    void qc.invalidateQueries({
      queryKey: ["map_member_role", mapId, user?.id],
    });
    void qc.invalidateQueries({ queryKey: ["map_plugins", mapId] });
    void qc.invalidateQueries({ queryKey: ["maps", user?.id] });
    toast.success("Ownership transferred");
  }

  async function togglePublic(next: boolean) {
    setPublicBusy(true);
    setInviteErr(null);
    const { error } = await supabase.rpc("set_map_public", {
      p_map_id: mapId,
      p_is_public: next,
    });
    setPublicBusy(false);
    if (error) {
      setInviteErr(error.message);
      return;
    }
    toast.success(next ? "Map is now public" : "Map is now private");
    void qc.invalidateQueries({ queryKey: ["maps", user?.id] });
    if (trimmedSlug) {
      void qc.invalidateQueries({ queryKey: ["public_map", trimmedSlug] });
    }
  }

  async function runDelete() {
    setDeleteBusy(true);
    setDeleteErr(null);
    const { error } = await supabase.rpc("delete_map", {
      p_map_id: mapId,
    });
    setDeleteBusy(false);
    if (error) {
      setDeleteErr(error.message);
      return;
    }
    setDeleteOpen(false);
    const fallback = maps.find((m) => m.id !== mapId) ?? null;
    await qc.invalidateQueries({ queryKey: ["maps", user?.id] });
    if (fallback) {
      setActiveMapId(fallback.id);
      navigate(
        fallback.owner_profile_slug
          ? mapViewHref("map", mapRouteForMap(fallback))
          : "/",
      );
    } else {
      navigate("/");
    }
    toast.success("Map deleted");
  }

  async function copyPublicLink() {
    if (!publicMapUrl) return;
    try {
      await navigator.clipboard.writeText(publicMapUrl);
      toast.success("Public link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <PageSharingRoot>
      <div>
        <PageSectionHeading>Sharing</PageSectionHeading>
        <PageSectionHint>
          Invite others by email. They must sign in with that email to accept.
          Connectors stay with each owner; transferring ownership clears all
          plugins for this map.
        </PageSectionHint>
      </div>

      {inviteErr ? <PageErrorText>{inviteErr}</PageErrorText> : null}

      <PageSharingSection>
        <PageSectionSubheading>Members</PageSectionSubheading>
        <BorderedList>
          {membersQuery.isLoading ? (
            <ListEmptyItem>Loading…</ListEmptyItem>
          ) : (
            members.map((m) => {
              const isSelf = m.user_id === user?.id;
              const label =
                m.profile?.display_name?.trim() || (isSelf ? "You" : "Member");
              return (
                <MemberListRow key={m.user_id}>
                  <MemberAvatar>
                    <UserAvatar
                      storedAvatarUrl={m.profile?.avatar_url}
                      email={isSelf ? user?.email : undefined}
                      gravatarFallback={isSelf}
                      gravatarSize={64}
                      label={label}
                      size="sm"
                    />
                  </MemberAvatar>
                  <MemberPrimary
                    secondary={isSelf && user?.email ? user.email : undefined}
                  >
                    {label}
                  </MemberPrimary>
                  <MemberRole>{mapRoleLabel(m.role)}</MemberRole>
                  {isOwner && !isSelf && m.role !== "owner" ? (
                    <MemberActions>
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          void changeRole(m.user_id, v as MapMemberRole)
                        }
                      >
                        <FormSelectTriggerCompact>
                          <SelectValue>{mapRoleLabel(m.role)}</SelectValue>
                        </FormSelectTriggerCompact>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Contributor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void removeMember(m.user_id)}
                      >
                        Remove
                      </Button>
                    </MemberActions>
                  ) : null}
                </MemberListRow>
              );
            })
          )}
        </BorderedList>
      </PageSharingSection>

      {isOwner ? (
        <>
          <PageSharingSection>
            <PageSectionSubheading>Invite by email</PageSectionSubheading>
            <PageInviteRow>
              <PageInviteEmailField>
                <Field>
                  <FieldLabel htmlFor="inv-email">Email</FieldLabel>
                  <FieldControl>
                    <Input
                      id="inv-email"
                      type="email"
                      autoComplete="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </FieldControl>
                </Field>
              </PageInviteEmailField>
              <PageInviteRoleField>
                <Field>
                  <FieldLabel htmlFor="inv-role">Access</FieldLabel>
                  <FieldControl>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as InviteMapRole)}
                    >
                      <FormSelectTriggerInvite id="inv-role">
                        <SelectValue>
                          {inviteRoleSelectLabel(inviteRole)}
                        </SelectValue>
                      </FormSelectTriggerInvite>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Contributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldControl>
                </Field>
              </PageInviteRoleField>
              <Button
                type="button"
                disabled={inviteBusy || !inviteEmail.trim()}
                onClick={() => void sendInvite()}
              >
                Send invite
              </Button>
            </PageInviteRow>
            <PageSectionHint>
              If they already have an account, they get an in-app notification.
              Pending invites work after they sign up with the same email.
            </PageSectionHint>
          </PageSharingSection>

          <PageSharingSection>
            <PageSectionSubheading>Public access</PageSectionSubheading>
            <Field>
              <FieldLabel htmlFor="map-public-toggle">
                Anyone with the link can view this map (read-only)
              </FieldLabel>
              <Switch
                id="map-public-toggle"
                checked={isPublic}
                disabled={publicBusy}
                onCheckedChange={(checked) => void togglePublic(checked)}
              />
            </Field>
            {isPublic && publicMapUrl ? (
              <PageInviteRow>
                <PageInviteEmailField>
                  <Field>
                    <FieldLabel htmlFor="public-map-url">
                      Public link
                    </FieldLabel>
                    <FieldControl>
                      <Input
                        id="public-map-url"
                        readOnly
                        value={publicMapUrl}
                        onFocus={(e) => e.target.select()}
                      />
                    </FieldControl>
                  </Field>
                </PageInviteEmailField>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyPublicLink()}
                >
                  Copy link
                </Button>
              </PageInviteRow>
            ) : null}
            <PageSectionHint>
              Public viewers can browse pins without signing in. Editing still
              requires an invite.
            </PageSectionHint>
          </PageSharingSection>

          {pendingInvites.length > 0 ? (
            <PageSharingSection>
              <PageSectionSubheading>Pending invitations</PageSectionSubheading>
              <BorderedList>
                {pendingInvites.map((inv) => (
                  <MemberListRow key={inv.id}>
                    <MemberPrimary>{inv.invitee_email}</MemberPrimary>
                    <MemberRole>{mapRoleLabel(inv.invited_role)}</MemberRole>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void cancelInvite(inv.id)}
                    >
                      Cancel
                    </Button>
                  </MemberListRow>
                ))}
              </BorderedList>
            </PageSharingSection>
          ) : null}

          <CautionPanel
            title="Transfer ownership"
            description={
              <>
                Enter the new owner&apos;s email. They must have an account (or
                sign up with that email). You will become a contributor. All map
                plugins and calendar feed links for &quot;{mapName}&quot; will
                be removed.
              </>
            }
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTransferErr(null);
                setTransferEmail("");
                setTransferOpen(true);
              }}
            >
              Transfer ownership…
            </Button>
          </CautionPanel>

          <CautionPanel
            title="Delete map"
            description={
              <>
                Permanently delete &quot;{mapName}&quot; and all of its pins.
                You cannot delete your only map.
              </>
            }
          >
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeleteErr(null);
                setDeleteOpen(true);
              }}
            >
              Delete map…
            </Button>
          </CautionPanel>

          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer ownership</DialogTitle>
                <DialogDescription>
                  This cannot be undone from here. Plugins for this map will be
                  cleared.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <DialogFormStack>
                  <DialogField>
                    <Field>
                      <FieldLabel htmlFor="transfer-email">
                        New owner email
                      </FieldLabel>
                      <FieldControl>
                        <Input
                          id="transfer-email"
                          type="email"
                          autoComplete="email"
                          placeholder="friend@example.com"
                          value={transferEmail}
                          onChange={(e) => setTransferEmail(e.target.value)}
                        />
                      </FieldControl>
                    </Field>
                  </DialogField>
                  {transferErr ? <FieldError>{transferErr}</FieldError> : null}
                </DialogFormStack>
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransferOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!transferEmail.trim() || transferBusy}
                  onClick={() => void runTransfer()}
                >
                  Confirm transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader showCloseButton={!deleteBusy}>
                <DialogTitle>Delete map?</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <DialogDescription>
                  This removes &quot;{mapName}&quot; and every pin on it. This
                  cannot be undone.
                </DialogDescription>
                {deleteErr ? <FieldError>{deleteErr}</FieldError> : null}
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteBusy}
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteBusy}
                  onClick={() => void runDelete()}
                >
                  {deleteBusy ? "Deleting…" : "Delete map"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <PageSectionHint>
          Only the map owner can invite people or transfer ownership.
        </PageSectionHint>
      )}
    </PageSharingRoot>
  );
}
