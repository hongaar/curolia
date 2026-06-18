import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PhotoGrid, PhotoGridPickerTile, PhotoGridThumb } from "./photo-grid";

describe("photo-grid", () => {
  it("renders static children", () => {
    render(
      <PhotoGrid>
        <PhotoGridThumb>Photo</PhotoGridThumb>
      </PhotoGrid>,
    );
    expect(document.body).toBeTruthy();
  });

  it("renders sortable items", () => {
    render(
      <PhotoGrid
        items={[{ id: "a" }]}
        getItemId={(item) => item.id}
        onReorder={() => {}}
        renderItem={() => <PhotoGridThumb>Photo</PhotoGridThumb>}
      />,
    );
    expect(document.body).toBeTruthy();
  });

  it("picker tile toggles via click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PhotoGridPickerTile
        src="https://example.com/photo.jpg"
        alt="Test"
        selected={false}
        onSelect={onSelect}
      />,
    );
    const button = screen.getByRole("button", { name: "Test" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
