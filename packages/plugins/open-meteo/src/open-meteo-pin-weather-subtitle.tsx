import { HoverTooltip } from "@curolia/ui/tooltip";
import {
  openMeteoWeatherKindTooltip,
  type OpenMeteoPinSubtitle,
} from "./open-meteo-weather";

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
