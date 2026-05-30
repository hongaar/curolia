import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { LoginTabTrigger, LoginTabsList } from "../login-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Components/Tabs",
  ...componentStoryMeta(
    `Tabbed regions with keyboard support via Base UI.`,
    `Match \`value\` on \`TabsTrigger\` and \`TabsContent\`. Use \`TabsList variant="line"\` for underline style. Login uses \`LoginTabsList\` / \`LoginTabTrigger\` for segmented pills.`,
  ),
  component: Tabs,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Default tab list with two panels."),
  render: () => (
    <StoryFrame width="md">
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Tab content one.</TabsContent>
        <TabsContent value="two">Tab content two.</TabsContent>
      </Tabs>
    </StoryFrame>
  ),
};

export const LineVariant: Story = {
  parameters: storyDocs(
    'Underline-style tabs using `TabsList variant="line"`.',
  ),
  render: () => (
    <StoryFrame width="md">
      <Tabs defaultValue="one">
        <TabsList variant="line">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Line tab content one.</TabsContent>
        <TabsContent value="two">Line tab content two.</TabsContent>
      </Tabs>
    </StoryFrame>
  ),
};

/** Login page segmented control (muted track, transparent inactive pills). */
export const LoginPill: Story = {
  parameters: storyDocs(
    "Login segmented control: muted track with transparent inactive pills.",
  ),
  render: () => (
    <StoryFrame width="md">
      <Tabs defaultValue="signin">
        <LoginTabsList>
          <LoginTabTrigger value="signin">Sign in</LoginTabTrigger>
          <LoginTabTrigger value="signup">Sign up</LoginTabTrigger>
        </LoginTabsList>
        <TabsContent value="signin">Sign-in form content.</TabsContent>
        <TabsContent value="signup">Sign-up form content.</TabsContent>
      </Tabs>
    </StoryFrame>
  ),
};
