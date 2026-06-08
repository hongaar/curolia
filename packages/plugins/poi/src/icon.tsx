import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

/** POI icon (red map pin). */
export function PoiIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        <path
          fill="#EA4335"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        />
        <circle cx="12" cy="9" r="2.5" fill="#fff" />
      </svg>
    </PluginIconFrame>
  );
}
