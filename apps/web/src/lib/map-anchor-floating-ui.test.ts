import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mapFloatingViewportPadding } from "./map-anchor-floating-ui";

describe("mapFloatingViewportPadding", () => {
  let layer: HTMLDivElement;

  beforeEach(() => {
    layer = document.createElement("div");
    layer.dataset.curoliaMapLayer = "";
    layer.getBoundingClientRect = () =>
      ({
        top: 80,
        right: 1200,
        bottom: 900,
        left: 0,
        width: 1200,
        height: 820,
        x: 0,
        y: 80,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(layer);
  });

  afterEach(() => {
    layer.remove();
  });

  it("insets from map layer top (toolbar) and edges", () => {
    const padding = mapFloatingViewportPadding();
    expect(padding).toEqual({
      top: 92,
      right: 12,
      bottom: 12,
      left: 12,
    });
  });
});
