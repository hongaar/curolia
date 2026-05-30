import type { ArgTypes } from "@storybook/react";

/** Component-level docs for the Storybook docs panel (summary + usage). */
export function componentDocs(
  summary: string,
  usage: string,
  displayTitle?: string,
) {
  return {
    docs: {
      ...(displayTitle ? { title: displayTitle } : {}),
      description: {
        component: `${summary}\n\n### Usage\n\n${usage}`,
      },
    },
  };
}

/** Per-story description shown in the docs panel. */
export function storyDocs(description: string) {
  return {
    docs: {
      description: { story: description },
    },
  };
}

/** Meta spread: autodocs tag, component description, optional argTypes. */
export function componentStoryMeta(
  summary: string,
  usage: string,
  options?: { argTypes?: ArgTypes },
) {
  return {
    tags: ["autodocs"],
    parameters: componentDocs(summary, usage),
    ...(options?.argTypes ? { argTypes: options.argTypes } : {}),
  };
}
