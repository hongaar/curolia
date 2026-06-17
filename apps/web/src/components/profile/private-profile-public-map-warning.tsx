import { CautionPanel } from "@curolia/ui/caution-panel";

type PrivateProfilePublicMapWarningProps = {
  context: "map-public-access" | "profile-visibility";
};

const WARNING_COPY = {
  "map-public-access": {
    title: "Public maps show your name",
    description:
      "Your profile is private, but anyone with a link to a public map can open it without signing in. Your display name will be shown on the map.",
  },
  "profile-visibility": {
    title: "Public maps stay visible",
    description:
      "Your profile is private, but public maps can still be opened by anyone with the link—including signed-out viewers. Your display name will be shown on those maps.",
  },
} as const;

export function PrivateProfilePublicMapWarning({
  context,
}: PrivateProfilePublicMapWarningProps) {
  const { title, description } = WARNING_COPY[context];
  return <CautionPanel title={title} description={description} />;
}
