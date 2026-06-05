import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

/** OpenStreetMap mark (green tile with map grid). */
export function OsmPoiIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        <rect width="32" height="32" rx="6" fill="#7ebc6f" />
        <path
          fill="#fff"
          fillOpacity="0.9"
          d="M6 8h8v8H6zm12 0h8v8h-8zM6 18h8v8H6zm12 0h8v8h-8z"
        />
        <path
          fill="#2d6a4f"
          d="M10 10h2v2h-2zm14 0h2v2h-2zM10 20h2v2h-2zm14 0h2v2h-2z"
        />
      </svg>
    </PluginIconFrame>
  );
}
