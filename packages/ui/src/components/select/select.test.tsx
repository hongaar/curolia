import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";

describe("select", () => {
  it("renders without crashing", () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(document.body).toBeTruthy();
  });
});
