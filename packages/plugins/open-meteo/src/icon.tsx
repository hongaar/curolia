import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

/** Open-Meteo mark (sky gradient tile). */
export function OpenMeteoIcon({
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
        <defs>
          <linearGradient id="om-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="6" fill="url(#om-sky)" />
        <circle cx="22" cy="10" r="5" fill="#fde047" />
        <path
          fill="#fff"
          fillOpacity="0.95"
          d="M6 22c2-4 6-6 10-6s9 2 11 6H6z"
        />
      </svg>
    </PluginIconFrame>
  );
}
