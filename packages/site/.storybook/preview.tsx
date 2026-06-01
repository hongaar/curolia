import "@curolia/ui/styles";
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "next-themes";
import { transformStorySource } from "../src/storybook/transform-story-source";

/** Match `packages/ui/src/styles/tokens.css` — used by Storybook backgrounds toolbar. */
const curoliaBackgrounds = {
  light: {
    name: "Curolia light",
    value: "oklch(0.955 0.018 88)",
  },
  dark: {
    name: "Curolia dark",
    value: "oklch(0.19 0.035 260)",
  },
} as const;

const preview: Preview = {
  decorators: [
    (Story, { globals }) => {
      const theme = globals.backgrounds?.value === "dark" ? "dark" : "light";
      return (
        <ThemeProvider
          attribute="class"
          forcedTheme={theme}
          enableSystem={false}
        >
          <Story />
        </ThemeProvider>
      );
    },
  ],
  parameters: {
    /** Marketing pages are full-viewport; padded layout skews breakpoints vs apps/web. */
    layout: "fullscreen",
    backgrounds: {
      options: curoliaBackgrounds,
    },
    docs: {
      toc: true,
      source: {
        excludeDecorators: true,
        transform: transformStorySource,
      },
    },
    options: {
      storySort: {
        order: ["Site", "*"],
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "light" },
  },
  tags: ["autodocs"],
};

export default preview;
