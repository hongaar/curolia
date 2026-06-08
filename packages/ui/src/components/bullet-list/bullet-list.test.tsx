import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BulletList } from "./bullet-list";

describe("bullet-list", () => {
  it("renders without crashing", () => {
    render(
      <BulletList>
        <li>Item</li>
      </BulletList>,
    );
    expect(document.body).toBeTruthy();
  });
});
