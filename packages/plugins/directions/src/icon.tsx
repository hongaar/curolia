import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

const directionsIcon = new URL("./assets/directions-icon.svg", import.meta.url)
  .href;

export function DirectionsIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <img src={directionsIcon} alt="" width="100%" height="100%" />
    </PluginIconFrame>
  );
}
