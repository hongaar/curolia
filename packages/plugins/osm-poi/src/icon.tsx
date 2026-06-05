import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

/** OpenStreetMap mark (magnifying glass over map, simplified from the OSM logo). */
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
        <path fill="#b1e479" d="M3 5c5 0 9 4 14 3s8-4 12-1v25H3V5z" />
        <path
          fill="#9ec5e8"
          fillOpacity="0.8"
          d="M4 22c4-3 9-2 13 1s9 3 11 0v9H4v-10z"
        />
        <circle cx="16" cy="13" r="6.5" fill="#fff" fillOpacity="0.22" />
        <circle
          cx="16"
          cy="13"
          r="6.5"
          fill="none"
          stroke="#2d3335"
          strokeWidth="2.5"
        />
        <path
          stroke="#2d3335"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M20.5 17.5 25.5 22.5"
        />
        <path
          stroke="#6d7f42"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          d="M13 11.5h6M12.5 14.5h7M14 17h4"
        />
      </svg>
    </PluginIconFrame>
  );
}
