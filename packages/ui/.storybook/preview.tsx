import type { Preview } from "@storybook/react";
import { ThemeProvider } from "next-themes";
import "../src/styles/index.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
        <div
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            minHeight: 120,
            padding: 16,
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
