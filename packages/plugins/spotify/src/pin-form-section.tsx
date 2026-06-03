import type { PinContextProps } from "@curolia/plugin-contract";
import { SpotifyPinMusicEditor } from "./spotify-pin-music-editor";
import { useSpotifyPinMusic } from "./use-spotify-pin-music";

/** Card header (icon + name) is provided by the pin editor shell. */
export function SpotifyPinFormSection(props: PinContextProps) {
  const music = useSpotifyPinMusic(props);
  if (!music.pluginReady) return null;

  return <SpotifyPinMusicEditor music={music} />;
}
