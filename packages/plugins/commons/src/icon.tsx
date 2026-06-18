import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

import { CommonsLogoMark } from "./commons-logo-mark";

/** Wikimedia Commons logo mark (official artwork, text omitted). */
export function CommonsIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <CommonsLogoMark />
    </PluginIconFrame>
  );
}
