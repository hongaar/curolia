import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

/** Google Photos mark (2020–2025), from Wikimedia Commons. */
export function GooglePhotosIcon({
  size = 4,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 59 59"
        aria-hidden="true"
        width="100%"
        height="100%"
      >
        <path
          fill="#FBBC04"
          d="M14.75 13.41c8.146 0 14.75 6.603 14.75 14.75v1.34H1.34C.6 29.5 0 28.9 0 28.16c0-8.147 6.604-14.75 14.75-14.75z"
        />
        <path
          fill="#EA4335"
          d="M45.59 14.75c0 8.146-6.603 14.75-14.75 14.75H29.5V1.34C29.5.6 30.1 0 30.84 0c8.147 0 14.75 6.604 14.75 14.75z"
        />
        <path
          fill="#4285F4"
          d="M44.25 45.59c-8.146 0-14.75-6.603-14.75-14.75V29.5h28.16c.74 0 1.34.6 1.34 1.34 0 8.147-6.604 14.75-14.75 14.75z"
        />
        <path
          fill="#34A853"
          d="M13.41 44.25c0-8.146 6.603-14.75 14.75-14.75h1.34v28.16c0 .74-.6 1.34-1.34 1.34-8.147 0-14.75-6.604-14.75-14.75z"
        />
      </svg>
    </PluginIconFrame>
  );
}
