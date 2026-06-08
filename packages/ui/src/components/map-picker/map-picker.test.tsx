import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "../dropdown-menu";
import { MapPickerTrigger } from "./map-picker";

describe("MapPickerTrigger", () => {
  it("renders without crashing", () => {
    render(
      <DropdownMenu>
        <MapPickerTrigger mapName="My map" mapEmoji="📍" />
      </DropdownMenu>,
    );
    expect(document.body).toBeTruthy();
  });
});
