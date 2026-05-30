import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

/** For Curolia navigation primitives that use `NavLink`. */
export const withMemoryRouter: Decorator = (Story) => (
  <MemoryRouter initialEntries={["/map"]}>
    <Story />
  </MemoryRouter>
);
