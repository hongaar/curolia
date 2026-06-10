import { HoverTooltip } from "@curolia/ui/tooltip";
import {
  openMeteoWeatherKindTooltip,
  type OpenMeteoPinSubtitle,
} from "./open-meteo-weather";

/** Typical subtitle length so layout does not shift while weather loads. */
const OPEN_METEO_SUBTITLE_PLACEHOLDER_TEXT = "☀️ Clear sky · 20°C";

export function OpenMeteoPinWeatherSubtitle({
  subtitle,
}: {
  subtitle: OpenMeteoPinSubtitle;
}) {
  return (
    <HoverTooltip content={openMeteoWeatherKindTooltip(subtitle.kind)}>
      {subtitle.text}
    </HoverTooltip>
  );
}

export function OpenMeteoPinWeatherSubtitlePlaceholder() {
  return (
    <span aria-hidden style={{ visibility: "hidden", userSelect: "none" }}>
      {OPEN_METEO_SUBTITLE_PLACEHOLDER_TEXT}
    </span>
  );
}
