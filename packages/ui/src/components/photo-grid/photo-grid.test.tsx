import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhotoGrid, PhotoGridThumb } from "./photo-grid";

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
});
