import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpotifyIcon } from "./plugin-marketing-icons";

describe("Plugin marketing icons", () => {
  it("renders Spotify icon", () => {
    render(<SpotifyIcon />);
    expect(document.body).toBeTruthy();
  });
});
