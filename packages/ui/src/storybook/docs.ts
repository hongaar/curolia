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

/** Per-control descriptions for the docs prop table when docgen has none. */
export function storyArgTypes(descriptions: Record<string, string>): ArgTypes {
  return Object.fromEntries(
    Object.entries(descriptions).map(([name, description]) => [
      name,
      { description },
    ]),
  );
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
