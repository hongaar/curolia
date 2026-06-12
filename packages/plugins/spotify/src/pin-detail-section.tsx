import type { PinContextProps } from "@curolia/plugin-contract";
import { PluginPinEmbed, PluginPinSpinner } from "@curolia/ui/plugin-pin";
import { spotifyEmbedHeight, spotifyEmbedSrc } from "./spotify-embed";
import { useSpotifyPinDisplay } from "./use-spotify-pin-display";
import { useSpotifyPinMusic } from "./use-spotify-pin-music";

/** Plain pin detail (`pinDetailPlain` on manifest): embed only, no plugin card chrome. */
export function SpotifyPinDetailSection(props: PinContextProps) {
  const isDisplay = props.pinSurface !== "edit";
  const display = useSpotifyPinDisplay(props);
  const music = useSpotifyPinMusic(props);

  if (isDisplay) {
    if (display.isPending) return <PluginPinSpinner />;
    if (!display.selected) return null;
    const selected = display.selected;
    return (
      <PluginPinEmbed
        src={spotifyEmbedSrc(selected.kind, selected.spotifyId)}
        title={`Spotify ${selected.kind}: ${selected.title}`}
        height={spotifyEmbedHeight(selected.kind)}
      />
    );
  }

  if (!music.pluginReady) return null;

  const { selected, busy } = music;
  if (!selected && !busy) return null;

  if (busy && !selected) {
    return <PluginPinSpinner />;
  }

  if (!selected) return null;

  return (
    <PluginPinEmbed
      src={spotifyEmbedSrc(selected.kind, selected.spotifyId)}
      title={`Spotify ${selected.kind}: ${selected.title}`}
      height={spotifyEmbedHeight(selected.kind)}
    />
  );
}
