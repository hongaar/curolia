import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationsIconTrigger } from "./notifications-popover";

describe("NotificationsIconTrigger", () => {
  it("renders without crashing", () => {
    render(<NotificationsIconTrigger hasUnread aria-label="Notifications" />);
    expect(document.body).toBeTruthy();
  });
});
