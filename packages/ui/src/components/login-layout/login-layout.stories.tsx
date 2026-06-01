import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Tabs } from "../tabs";
import {
  LoginActions,
  LoginField,
  LoginFooterNote,
  LoginHeader,
  LoginInlineCode,
  LoginLayout,
  LoginTabPanel,
  LoginTabsList,
  LoginTabTrigger,
} from "./login-layout";

const meta = {
  title: "Login Layout",
  ...componentStoryMeta(
    `Centered login/sign-up card with segmented tabs.`,
    `Wrap content in \`LoginLayout\`, add \`LoginHeader\`, \`LoginTabsList\` / \`LoginTabTrigger\`, and \`LoginTabPanel\` per tab.`,
  ),
  component: LoginLayout,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Login card with sign-in tab and email field."),
  render: () => (
    <LoginLayout>
      <LoginHeader />
      <Tabs defaultValue="signin">
        <LoginTabsList>
          <LoginTabTrigger value="signin">Sign in</LoginTabTrigger>
          <LoginTabTrigger value="signup">Sign up</LoginTabTrigger>
        </LoginTabsList>
        <LoginTabPanel
          value="signin"
          onSubmit={(event) => event.preventDefault()}
        >
          <LoginField>
            <Label htmlFor="story-login-email">Email</Label>
            <Input
              id="story-login-email"
              type="email"
              placeholder="you@example.com"
            />
          </LoginField>
          <LoginActions>
            <Button type="submit">Sign in</Button>
          </LoginActions>
          <LoginFooterNote>
            Local dev? Use <LoginInlineCode>demo@curolia.app</LoginInlineCode>
          </LoginFooterNote>
        </LoginTabPanel>
        <LoginTabPanel
          value="signup"
          onSubmit={(event) => event.preventDefault()}
        >
          <LoginField>
            <Label htmlFor="story-login-signup-email">Email</Label>
            <Input id="story-login-signup-email" type="email" />
          </LoginField>
          <LoginActions>
            <Button type="submit">Sign up</Button>
          </LoginActions>
        </LoginTabPanel>
      </Tabs>
    </LoginLayout>
  ),
};
