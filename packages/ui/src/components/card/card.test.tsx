import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent } from "./card";

describe("card", () => {
  it("renders without crashing", () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>,
    );
    expect(document.body).toBeTruthy();
  });
});
