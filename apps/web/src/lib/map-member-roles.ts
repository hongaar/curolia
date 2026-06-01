import type { MapMemberRole } from "@/types/database";

export function mapRoleLabel(role: MapMemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Contributor";
    case "viewer":
      return "Reader";
    default:
      return role;
  }
}

export type InviteMapRole = "viewer" | "editor";
