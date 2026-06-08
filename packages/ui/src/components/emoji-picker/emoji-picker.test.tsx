import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmojiFieldPicker } from "../picker/picker";

describe("EmojiFieldPicker", () => {
  it("renders without crashing", () => {
    render(<EmojiFieldPicker value="📍" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
