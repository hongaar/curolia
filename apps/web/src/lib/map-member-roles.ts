import type { MapMemberRole } from "@/types/database";

export function mapRoleLabel(role: MapMemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Contributor";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

export type InviteMapRole = "viewer" | "editor";

/** Label shown in access `<Select>` triggers (values stay `viewer` / `editor`). */
export function inviteRoleSelectLabel(role: InviteMapRole): string {
  return mapRoleLabel(role);
}
