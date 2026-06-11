import { Capacitor } from "@capacitor/core";

export const NATIVE_SHARE_EVENT = "curolia:native-share";

export type NativeShareDetail = {
  text: string;
};

type NativeShareListener = (text: string) => void;

const listeners = new Set<NativeShareListener>();
const pendingTexts: string[] = [];
let receiverInstalled = false;

function emitShare(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (listeners.size === 0) {
    pendingTexts.push(trimmed);
    return;
  }
  for (const listener of listeners) {
    listener(trimmed);
  }
}

function onNativeShareEvent(event: Event) {
  const detail = (event as CustomEvent<NativeShareDetail>).detail;
  if (!detail?.text) return;
  emitShare(detail.text);
}

/** Listen for Android share intents bridged from MainActivity. */
export function installNativeShareReceiver() {
  if (!Capacitor.isNativePlatform() || receiverInstalled) return;
  receiverInstalled = true;
  window.addEventListener(NATIVE_SHARE_EVENT, onNativeShareEvent);
}

/** Subscribe to shared text; replays any share received before subscribe. */
export function subscribeNativeShare(
  listener: NativeShareListener,
): () => void {
  listeners.add(listener);
  while (pendingTexts.length > 0) {
    listener(pendingTexts.shift()!);
  }
  return () => {
    listeners.delete(listener);
  };
}
