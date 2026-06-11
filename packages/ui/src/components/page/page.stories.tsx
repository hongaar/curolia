import type { Meta, StoryObj } from "@storybook/react";
import { Map, Settings, User } from "lucide-react";
import type { ReactNode } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Field, FieldControl, FieldDescription, FieldLabel } from "../field";
import { Input } from "../input";
import { Label } from "../label";
import { PageBackButton } from "../page-back-button";
import { Switch } from "../switch";
import {
  AppPageLayout,
  Page,
  PageAnchoredSection,
  PageAvatarActions,
  PageAvatarHint,
  PageAvatarRow,
  PageAvatarSection,
  PageCapitalize,
  PageCenteredError,
  PageCenteredLoading,
  PageClassicHeader,
  PageClassicHeaderRow,
  PageContent,
  PageContentStack,
  PageEmailLine,
  PageErrorText,
  PageExternalLink,
  PageFab,
  PageFitButton,
  PageFormBlockSpaced,
  PageGrid2,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PageInviteEmailField,
  PageInviteRoleField,
  PageInviteRow,
  PageMessageText,
  PageMuted,
  PagePanel,
  PagePanelHeaderBlock,
  PagePanelIcon,
  PagePanelTitleLg,
  PagePanelTitleRow,
  PageProfileGrid,
  PageScroll,
  PageSection,
  PageSectionHeading,
  PageSectionHint,
  PageSectionSpaced,
  PageSectionSubheading,
  PageSectionTitle,
  PageSharingRoot,
  PageSharingSection,
  PageSideNav,
  PageSideNavItem,
  PageSideNavLayout,
  PageSideNavLink,
  PageSideNavList,
  PageSwitchRow,
  PageSwitchStack,
  PageTitle,
} from "./page";
import styles from "./page.stories.module.css";

const meta = {
  title: "Page",
  ...componentStoryMeta(
    "Scrollable settings and content page shell with layout primitives for titles, sections, panels, and form blocks.",
    "Prefer `AppPageLayout` for standard in-app settings pages. Use `PageHeader`, `PageHeaderTitle`, and `PageHeaderLead` inside `PagePanel`. Compose lower-level pieces (`Page`, `PageScroll`, `PageContentStack`) when you need custom scroll or width behavior.",
  ),
  component: Page,
} satisfies Meta;

export default meta;
type Story = StoryObj;

function PageShell({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}

export const AppPageLayoutDefault: Story = {
  name: "App page layout",
  parameters: storyDocs(
    "`AppPageLayout` wraps `Page`, `PageScroll underNav`, and `PageContentStack`.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout
        toolbar={<PageBackButton label="Back" onClick={() => undefined} />}
      >
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Map settings</PageHeaderTitle>
            <PageHeaderLead>
              Owners can rename the map and tune how pins appear.
            </PageHeaderLead>
          </PageHeader>
          <PageFormBlockSpaced>
            <Field>
              <FieldLabel htmlFor="story-page-map-name">Map name</FieldLabel>
              <FieldControl>
                <Input id="story-page-map-name" defaultValue="Summer 2025" />
              </FieldControl>
              <FieldDescription>
                Shown in the sidebar and share links.
              </FieldDescription>
            </Field>
            <PageInlineActions>
              <Button>Save</Button>
            </PageInlineActions>
          </PageFormBlockSpaced>
        </PagePanel>
      </AppPageLayout>
    </PageShell>
  ),
};

export const ContentWidths: Story = {
  parameters: storyDocs(
    "`PageContentStack` width tokens: narrow (32rem), default/wide (42rem), 2xl (56rem).",
  ),
  render: () => (
    <PageShell>
      <Page>
        <PageScroll underNav>
          <PageContentStack width="2xl">
            <PageMuted>
              2xl content stack — pin detail and wide settings.
            </PageMuted>
            <PageContent width="narrow">
              <PageSectionTitle>Nested narrow content</PageSectionTitle>
              <PageMuted>
                `PageContent` can narrow an inner block inside a wider stack.
              </PageMuted>
            </PageContent>
          </PageContentStack>
        </PageScroll>
      </Page>
    </PageShell>
  ),
};

export const PageHeaderDefault: Story = {
  name: "Page header",
  parameters: storyDocs(
    '`PageHeader` stacks `PageHeaderTitle` and optional `PageHeaderLead` with `gap="xs"`.',
  ),
  render: () => (
    <StoryFrame width="md">
      <PagePanel>
        <PageHeader>
          <PageHeaderTitle>Settings</PageHeaderTitle>
          <PageHeaderLead>Appearance and other preferences.</PageHeaderLead>
        </PageHeader>
      </PagePanel>
    </StoryFrame>
  ),
};

export const PageHeaderTitleOnly: Story = {
  name: "Page header title only",
  parameters: storyDocs(
    "`PageHeaderTitle` alone when no supporting lead copy is needed.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PagePanel>
        <PageHeader>
          <PageHeaderTitle>Notifications</PageHeaderTitle>
        </PageHeader>
      </PagePanel>
    </StoryFrame>
  ),
};

export const PageHeaderWithFormBlock: Story = {
  name: "Page header with form block",
  parameters: storyDocs(
    "Typical panel page: header, then `PageFormBlockSpaced` with form fields.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout
        toolbar={<PageBackButton label="Back" onClick={() => undefined} />}
      >
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Profile</PageHeaderTitle>
            <PageHeaderLead>
              Update how you appear in the app. Email is managed by your account
              provider.
            </PageHeaderLead>
          </PageHeader>
          <PageFormBlockSpaced>
            <Field>
              <FieldLabel htmlFor="story-page-header-name">
                Display name
              </FieldLabel>
              <FieldControl>
                <Input
                  id="story-page-header-name"
                  defaultValue="Alex Example"
                />
              </FieldControl>
              <FieldDescription>
                Shown on pins and invitations.
              </FieldDescription>
            </Field>
            <PageInlineActions>
              <Button>Save changes</Button>
            </PageInlineActions>
          </PageFormBlockSpaced>
        </PagePanel>
      </AppPageLayout>
    </PageShell>
  ),
};

export const PageClassicHeaderStory: Story = {
  name: "Classic header",
  parameters: storyDocs(
    "`PageClassicHeader` and `PageTitle` for non-panel toolbar headers with optional actions.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PageClassicHeader>
        <PageClassicHeaderRow>
          <PageTitle>Notifications</PageTitle>
          <Button size="sm" variant="outline">
            Mark all read
          </Button>
        </PageClassicHeaderRow>
        <PageMuted>Activity from maps you follow.</PageMuted>
      </PageClassicHeader>
    </StoryFrame>
  ),
};

export const HeaderPrimitives: Story = {
  parameters: storyDocs(
    "Both header styles on one page: `PageClassicHeader` outside a panel and `PageHeader` inside `PagePanel`.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout>
        <PageClassicHeader>
          <PageClassicHeaderRow>
            <PageTitle>Notifications</PageTitle>
            <Button size="sm" variant="outline">
              Mark all read
            </Button>
          </PageClassicHeaderRow>
          <PageMuted>Activity from maps you follow.</PageMuted>
        </PageClassicHeader>
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Display title</PageHeaderTitle>
            <PageHeaderLead>
              Lead copy under a large settings heading.
            </PageHeaderLead>
          </PageHeader>
        </PagePanel>
      </AppPageLayout>
    </PageShell>
  ),
};

export const Sections: Story = {
  parameters: storyDocs(
    "Section spacing, headings, subheadings, hints, and inline action rows.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout>
        <PageSectionSpaced large>
          <PageSectionHeading>Notifications</PageSectionHeading>
          <PageSectionHint>
            In-app notifications are always on. Email and push are optional.
          </PageSectionHint>
          <PageMessageText>Preferences saved just now.</PageMessageText>
          <PageInlineActions spaced="tight">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="outline">
              Reset
            </Button>
          </PageInlineActions>
        </PageSectionSpaced>
        <PageSection>
          <PageSectionSubheading>Members</PageSectionSubheading>
          <PageSectionHint>
            Editors can add pins; viewers are read-only.
          </PageSectionHint>
        </PageSection>
        <PageErrorText>Could not load members.</PageErrorText>
      </AppPageLayout>
    </PageShell>
  ),
};

export const SwitchRows: Story = {
  parameters: storyDocs(
    "`PageSwitchStack` and `PageSwitchRow` for settings toggles.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout>
        <PageSwitchStack>
          <PageSwitchRow
            label={<Label htmlFor="story-page-email">Email</Label>}
            hint="Invitation summaries when enabled."
            control={
              <Switch id="story-page-email" defaultChecked aria-label="Email" />
            }
          />
          <PageSwitchRow
            label={<Label htmlFor="story-page-push">Push</Label>}
            control={<Switch id="story-page-push" aria-label="Push" />}
          />
        </PageSwitchStack>
      </AppPageLayout>
    </PageShell>
  ),
};

export const ProfileLayout: Story = {
  parameters: storyDocs(
    "Avatar block primitives for the profile page: grid, row, actions, and hints.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout>
        <PageProfileGrid>
          <PageAvatarSection>
            <Label>Photo</Label>
            <PageAvatarRow>
              <div className={styles.avatarPlaceholder} aria-hidden />
              <PageAvatarActions>
                <Button size="sm" variant="outline">
                  Upload
                </Button>
                <Button size="sm" variant="ghost">
                  Remove
                </Button>
              </PageAvatarActions>
            </PageAvatarRow>
            <PageAvatarHint>
              We use{" "}
              <PageExternalLink href="https://gravatar.com">
                Gravatar
              </PageExternalLink>{" "}
              for this email when no photo is set.
            </PageAvatarHint>
          </PageAvatarSection>
          <PageEmailLine highlight="you@example.com">
            Signed in as{" "}
          </PageEmailLine>
          <PageFitButton>
            <Button>Save changes</Button>
          </PageFitButton>
        </PageProfileGrid>
      </AppPageLayout>
    </PageShell>
  ),
};

export const SideNavLayout: Story = {
  name: "Side nav layout",
  parameters: storyDocs(
    "`PageSideNavLayout` shows a sticky section nav from 48rem. Use `PageAnchoredSection` for scroll targets.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout width="2xl">
        <PageSideNavLayout
          navHeader={<PageBackButton label="Back" onClick={() => undefined} />}
          nav={
            <PageSideNav aria-label="Settings sections">
              <PageSideNavList>
                <PageSideNavItem>
                  <PageSideNavLink active onClick={() => undefined}>
                    General
                  </PageSideNavLink>
                </PageSideNavItem>
                <PageSideNavItem>
                  <PageSideNavLink onClick={() => undefined}>
                    Sharing
                  </PageSideNavLink>
                </PageSideNavItem>
                <PageSideNavItem>
                  <PageSideNavLink onClick={() => undefined}>
                    Calendar
                  </PageSideNavLink>
                </PageSideNavItem>
              </PageSideNavList>
            </PageSideNav>
          }
        >
          <PageAnchoredSection id="story-page-general">
            <PagePanel>
              <PageHeader>
                <PageHeaderTitle>General</PageHeaderTitle>
                <PageHeaderLead>
                  Map name, style, and display options.
                </PageHeaderLead>
              </PageHeader>
            </PagePanel>
          </PageAnchoredSection>
          <PageAnchoredSection id="story-page-sharing">
            <PagePanel>
              <PagePanelTitleRow>Sharing</PagePanelTitleRow>
              <PageMuted>Members, invites, and public access.</PageMuted>
            </PagePanel>
          </PageAnchoredSection>
          <PageAnchoredSection id="story-page-calendar">
            <PagePanel mobileCard>
              <PagePanelTitleRow>Calendar</PagePanelTitleRow>
              <PageMuted>Plugin map settings panel.</PageMuted>
            </PagePanel>
          </PageAnchoredSection>
        </PageSideNavLayout>
      </AppPageLayout>
    </PageShell>
  ),
};

export const SharingLayout: Story = {
  parameters: storyDocs(
    "Sharing page layout: root spacing, sections, and invite row field slots.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout width="wide">
        <PageSharingRoot>
          <PageSharingSection>
            <PageSectionSubheading>Invite by email</PageSectionSubheading>
            <PageInviteRow>
              <PageInviteEmailField>
                <Field>
                  <FieldLabel htmlFor="story-page-invite-email">
                    Email
                  </FieldLabel>
                  <FieldControl>
                    <Input
                      id="story-page-invite-email"
                      type="email"
                      placeholder="friend@example.com"
                    />
                  </FieldControl>
                </Field>
              </PageInviteEmailField>
              <PageInviteRoleField>
                <Field>
                  <FieldLabel>Access</FieldLabel>
                  <FieldControl>
                    <Input readOnly value="Viewer" />
                  </FieldControl>
                </Field>
              </PageInviteRoleField>
              <Button>Send invite</Button>
            </PageInviteRow>
            <PageSectionHint>
              Pending invites work after they sign up with the same email.
            </PageSectionHint>
          </PageSharingSection>
        </PageSharingRoot>
      </AppPageLayout>
    </PageShell>
  ),
};

export const PanelTitles: Story = {
  parameters: storyDocs(
    "Panel title sizes and icon rows inside floating panels.",
  ),
  render: () => (
    <PageShell>
      <AppPageLayout>
        <PagePanel>
          <PagePanelHeaderBlock>
            <PagePanelTitleRow
              icon={
                <PagePanelIcon>
                  <Map aria-hidden />
                </PagePanelIcon>
              }
            >
              Map plugins
            </PagePanelTitleRow>
            <PageMuted>Enable integrations per map.</PageMuted>
          </PagePanelHeaderBlock>
          <PagePanelTitleLg>Large panel title</PagePanelTitleLg>
          <PageCapitalize>viewer</PageCapitalize> role
        </PagePanel>
      </AppPageLayout>
    </PageShell>
  ),
};

export const GridAndFab: Story = {
  parameters: storyDocs(
    "`PageGrid2` for two-column blocks and `PageFab` for floating actions.",
  ),
  render: () => (
    <PageShell>
      <Page>
        <PageScroll underNav>
          <PageContentStack>
            <PageGrid2>
              <PagePanel>
                <PageSectionTitle>Maps</PageSectionTitle>
                <PageMuted>3 maps</PageMuted>
              </PagePanel>
              <PagePanel>
                <PageSectionTitle>Plugins</PageSectionTitle>
                <PageMuted>5 enabled</PageMuted>
              </PagePanel>
            </PageGrid2>
            <PageFab>
              <Button>
                <Settings aria-hidden />
                Settings
              </Button>
            </PageFab>
          </PageContentStack>
        </PageScroll>
      </Page>
    </PageShell>
  ),
};

export const CenteredStates: Story = {
  parameters: storyDocs(
    "`PageCenteredLoading` and `PageCenteredError` for full-page wait and failure states.",
  ),
  render: () => (
    <div className={styles.centeredRow}>
      <PageShell>
        <PageCenteredLoading>Loading map…</PageCenteredLoading>
      </PageShell>
      <PageShell>
        <PageCenteredError
          actions={
            <Button size="sm" variant="outline">
              Try again
            </Button>
          }
        >
          This map could not be loaded.
        </PageCenteredError>
      </PageShell>
    </div>
  ),
};

export const LowLevelComposition: Story = {
  parameters: storyDocs(
    "Compose `Page`, `PageScroll`, and `PageContent` directly when `AppPageLayout` is too opinionated.",
  ),
  render: () => (
    <PageShell>
      <Page>
        <PageScroll>
          <PageContent width="wide">
            <PageClassicHeader>
              <PageClassicHeaderRow>
                <User aria-hidden className={styles.headerIcon} />
                <PageTitle>Account</PageTitle>
              </PageClassicHeaderRow>
            </PageClassicHeader>
            <PageMuted>Lower-level scroll without under-nav padding.</PageMuted>
          </PageContent>
        </PageScroll>
      </Page>
    </PageShell>
  ),
};
