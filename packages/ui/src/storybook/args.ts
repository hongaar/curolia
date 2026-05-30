import { useArgs as useStorybookArgs } from "storybook/preview-api";

/**
 * Story args synced with the Controls panel.
 * @see https://storybook.js.org/docs/writing-stories/args
 */
export function useStoryArgs<T extends Record<string, unknown>>() {
  return useStorybookArgs<T>();
}
