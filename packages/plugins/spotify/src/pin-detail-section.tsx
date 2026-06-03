import type { PinContextProps } from "@curolia/plugin-contract";
import { PluginPinEmbed, PluginPinSpinner } from "@curolia/ui/plugin-pin";
import { spotifyEmbedHeight, spotifyEmbedSrc } from "./spotify-embed";
import { useSpotifyPinMusic } from "./use-spotify-pin-music";

/** Plain pin detail (`pinDetailPlain` on manifest): embed only, no plugin card chrome. */
export function SpotifyPinDetailSection(props: PinContextProps) {
  const music = useSpotifyPinMusic(props);
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
