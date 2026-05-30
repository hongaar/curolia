import { PluginIconFrame } from "@curolia/ui/curolia/plugin-icon-frame";

export function GooglePhotosIcon({
  size = 4,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <svg viewBox="0 0 256 256" aria-hidden="true" width="100%" height="100%">
        <path fill="#FBBC04" d="M43 128l29-50h86l29 50z" />
        <path fill="#EA4335" d="M43 128l29 50h86L128 78z" />
        <path fill="#34A853" d="M128 78l29 50 29-50H128z" />
        <path fill="#4285F4" d="M128 178l29-50H43l29 50z" />
      </svg>
    </PluginIconFrame>
  );
}
