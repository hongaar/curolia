import { MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX } from "@curolia/ui/map";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cancelMapPanelPinScrollFollow,
  focusMapPanelPin,
  mapPanelPinScrollTargetTop,
} from "./scroll-map-panel-to-pin";

describe("mapPanelPinScrollTargetTop", () => {
  it("scrolls so the pin sits at the panel top margin", () => {
    const scrollRoot = document.createElement("div");
    const pin = document.createElement("div");
    Object.defineProperty(scrollRoot, "scrollTop", {
      configurable: true,
      writable: true,
      value: 120,
    });
    scrollRoot.getBoundingClientRect = () =>
      ({
        top: 80,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    pin.getBoundingClientRect = () =>
      ({
        top: 400,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;

    expect(mapPanelPinScrollTargetTop(scrollRoot, pin)).toBe(
      120 + (400 - 80 - MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX),
    );
  });
});

describe("focusMapPanelPin", () => {
  const roots: HTMLElement[] = [];

  // focusMapPanelPin keeps a follow loop on a timer; stop it so it cannot
  // fire after the jsdom environment is torn down.
  afterEach(() => {
    roots.splice(0).forEach(cancelMapPanelPinScrollFollow);
  });

  it("uses native scrollTo with smooth behavior", () => {
    const scrollRoot = document.createElement("div");
    roots.push(scrollRoot);
    const pin = document.createElement("div");
    pin.setAttribute("data-blog-pin-id", "pin-1");
    scrollRoot.appendChild(pin);
    Object.defineProperty(scrollRoot, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    Object.defineProperty(scrollRoot, "scrollHeight", {
      configurable: true,
      value: 4000,
    });
    scrollRoot.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 800,
        width: 0,
        height: 800,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    pin.getBoundingClientRect = () =>
      ({
        top: 1200,
        left: 0,
        right: 0,
        bottom: 1400,
        width: 0,
        height: 200,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    const scrollTo = vi.fn();
    scrollRoot.scrollTo = scrollTo;

    expect(focusMapPanelPin(scrollRoot, "pin-1", "blog")).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1200 - MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
      behavior: "smooth",
    });
  });

  it("uses instant scroll when behavior is auto", () => {
    const scrollRoot = document.createElement("div");
    roots.push(scrollRoot);
    const pin = document.createElement("div");
    pin.setAttribute("data-blog-pin-id", "pin-1");
    scrollRoot.appendChild(pin);
    Object.defineProperty(scrollRoot, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    Object.defineProperty(scrollRoot, "scrollHeight", {
      configurable: true,
      value: 4000,
    });
    scrollRoot.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 0,
        bottom: 800,
        width: 0,
        height: 800,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    pin.getBoundingClientRect = () =>
      ({
        top: 1200,
        left: 0,
        right: 0,
        bottom: 1400,
        width: 0,
        height: 200,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    const scrollTo = vi.fn();
    scrollRoot.scrollTo = scrollTo;

    expect(focusMapPanelPin(scrollRoot, "pin-1", "blog", "auto")).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({
      top: 1200 - MAP_PANEL_PIN_SCROLL_TOP_MARGIN_PX,
      behavior: "auto",
    });
  });
});
