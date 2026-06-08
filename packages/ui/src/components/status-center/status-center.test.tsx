import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusCenterMessage } from "./status-center";

describe("StatusCenterMessage", () => {
  it("renders without crashing", () => {
    render(<StatusCenterMessage>Loading</StatusCenterMessage>);
    expect(document.body).toBeTruthy();
  });
});
