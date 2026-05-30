import { describe, expect, it } from "vitest";

import { transformStorySource } from "./transform-story-source";

/** Shape Storybook often passes when `render` uses `StoryFrame` (no `render:` prefix). */
const storybookJsxSnippet = `      <Card>
        <CardHeader>
          <CardTitle>Trace settings</CardTitle>
          <CardDescription>Configure metadata for this trace.</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p style={{
          margin: 0
        }}>Card body content.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </StoryFrame>
}`;

const cardCsf = `export const Default = {
  render: () => (
    <StoryFrame width="md">
      <Card>
        <CardHeader>
          <CardTitle>Trace settings</CardTitle>
        </CardHeader>
      </Card>
    </StoryFrame>
  ),
};`;

describe("transformStorySource", () => {
  it("handles Storybook JSX snippets with trailing brace and orphan StoryFrame close", () => {
    const out = transformStorySource(storybookJsxSnippet);
    expect(out).not.toContain("StoryFrame");
    expect(out).not.toMatch(/\n\}$/);
    expect(out).toMatch(/^<Card>\n {2}<CardHeader>/);
    expect(out).toContain("<p style={{");
  });

  it("strips StoryFrame from full CSF render", () => {
    const out = transformStorySource(cardCsf);
    expect(out).not.toContain("StoryFrame");
    expect(out).toMatch(/^<Card>\n {2}<CardHeader>/);
  });
});
