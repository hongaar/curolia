import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationsIconTrigger } from "./notifications-popover";

describe("NotificationsIconTrigger", () => {
  it("renders without crashing", () => {
    render(<NotificationsIconTrigger count={0} />);
    expect(document.body).toBeTruthy();
  });
});
