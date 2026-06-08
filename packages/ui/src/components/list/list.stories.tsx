import type { Meta, StoryObj } from "@storybook/react";
import { List, Star } from "lucide-react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  BorderedList,
  CheckList,
  CheckListOption,
  ListEmptyItem,
  MemberActions,
  MemberAvatar,
  MemberListRow,
  MemberPrimary,
  MemberRole,
  NotificationListButton,
  SelectList,
  SelectListOption,
} from "./list";
import styles from "./list.stories.module.css";

const meta = {
  title: "List",
  ...componentStoryMeta(
    "Bordered lists for notifications, members, and selectable option rows.",
    "Compose `BorderedList` with row primitives (`NotificationListButton`, `MemberListRow`, …) or use `SelectList` / `CheckList` for single- and multi-select patterns.",
  ),
  component: BorderedList,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Notifications: Story = {
  name: "Notification rows",
  parameters: storyDocs(
    "`NotificationListButton` with unread dot, title, body, and meta timestamp.",
  ),
  render: () => (
    <StoryFrame width="md">
      <BorderedList>
        <NotificationListButton
          unread
          title="Map invitation"
          body='Alex invited you to "Summer 2025".'
          meta="2h ago"
          onClick={() => undefined}
        />
        <NotificationListButton
          unread={false}
          title="Pin comment"
          body="Sam mentioned you on Café de Flore."
          meta="Yesterday"
          onClick={() => undefined}
        />
        <NotificationListButton
          unread={false}
          title="Weekly digest"
          meta="Mon 9:00"
          onClick={() => undefined}
        />
      </BorderedList>
    </StoryFrame>
  ),
};

export const Empty: Story = {
  parameters: storyDocs("`ListEmptyItem` placeholder inside `BorderedList`."),
  render: () => (
    <StoryFrame width="md">
      <BorderedList>
        <ListEmptyItem>Nothing here yet.</ListEmptyItem>
      </BorderedList>
    </StoryFrame>
  ),
};

export const MemberRows: Story = {
  parameters: storyDocs(
    "`MemberListRow` with avatar, primary/secondary text, role, and action slot.",
  ),
  render: () => (
    <StoryFrame width="md">
      <div className={styles.sectionBlock}>
        <p className={styles.sectionLabel}>Members</p>
        <BorderedList>
          <MemberListRow>
            <MemberAvatar>
              <span className={styles.avatar} aria-hidden>
                J
              </span>
            </MemberAvatar>
            <MemberPrimary secondary="you@example.com">You</MemberPrimary>
            <MemberRole>Owner</MemberRole>
          </MemberListRow>
          <MemberListRow>
            <MemberAvatar>
              <span className={styles.avatar} aria-hidden>
                A
              </span>
            </MemberAvatar>
            <MemberPrimary secondary="alex@example.com">Alex</MemberPrimary>
            <MemberRole>Contributor</MemberRole>
            <MemberActions>
              <Button size="sm" variant="ghost">
                Remove
              </Button>
            </MemberActions>
          </MemberListRow>
          <MemberListRow>
            <MemberAvatar>
              <span className={styles.avatar} aria-hidden>
                S
              </span>
            </MemberAvatar>
            <MemberPrimary>Sam</MemberPrimary>
            <MemberRole>Viewer</MemberRole>
            <MemberActions>
              <Button size="sm" variant="outline">
                Role
              </Button>
              <Button size="sm" variant="ghost">
                Remove
              </Button>
            </MemberActions>
          </MemberListRow>
        </BorderedList>
      </div>
    </StoryFrame>
  ),
};

type SelectListArgs = {
  value: "viewer" | "editor";
};

export const SelectListSingle: Story = {
  name: "Select list",
  parameters: storyDocs(
    "`SelectList` + `SelectListOption` radio rows with optional icon, description, and meta.",
  ),
  args: {
    value: "viewer",
  } satisfies SelectListArgs,
  render: function Render() {
    const [{ value }, updateArgs] = useStoryArgs<SelectListArgs>();

    return (
      <StoryFrame width="md">
        <SelectList
          name="story-list-role"
          value={value}
          onValueChange={(next) => updateArgs({ value: next })}
        >
          <SelectListOption
            value="viewer"
            label="Viewer"
            description="Can browse pins and maps read-only."
            meta="Free"
          />
          <SelectListOption
            value="editor"
            label="Contributor"
            description="Can add and edit pins on shared maps."
            meta="Invited"
          />
        </SelectList>
      </StoryFrame>
    );
  },
};

type CheckListArgs = {
  selected: string[];
};

const CHECK_LIST_OPTIONS = [
  {
    id: "starred",
    label: "Starred places",
    description: "Your starred favorites on Google Maps",
    meta: "24 places",
    icon: <Star aria-hidden />,
  },
  {
    id: "summer-2024",
    label: "Summer 2024",
    description: "Saved list from Google Maps",
    meta: "12 places",
    icon: <List aria-hidden />,
  },
  {
    id: "food",
    label: "Food & drink",
    description: "Already imported to this map",
    meta: "8 places",
    icon: <List aria-hidden />,
    disabled: true,
  },
] as const;

export const CheckListMulti: Story = {
  name: "Check list",
  parameters: storyDocs(
    "`CheckList` + `CheckListOption` multi-select rows; mirrors map import list picking.",
  ),
  args: {
    selected: ["starred"],
  } satisfies CheckListArgs,
  render: function Render() {
    const [{ selected }, updateArgs] = useStoryArgs<CheckListArgs>();
    const selectedSet = new Set(selected);

    return (
      <StoryFrame width="md">
        <CheckList
          selected={selectedSet}
          onToggle={(id, checked) => {
            const next = new Set(selectedSet);
            if (checked) next.add(id);
            else next.delete(id);
            updateArgs({ selected: [...next] });
          }}
        >
          {CHECK_LIST_OPTIONS.map((option) => (
            <CheckListOption
              key={option.id}
              value={option.id}
              label={option.label}
              description={option.description}
              meta={option.meta}
              icon={option.icon}
              disabled={"disabled" in option ? option.disabled : false}
            />
          ))}
        </CheckList>
      </StoryFrame>
    );
  },
};

export const SelectListDisabled: Story = {
  parameters: storyDocs(
    "`SelectList` with `disabled` prevents changing selection.",
  ),
  args: {
    value: "editor",
  } satisfies SelectListArgs,
  render: function Render() {
    const [{ value }, updateArgs] = useStoryArgs<SelectListArgs>();

    return (
      <StoryFrame width="md">
        <SelectList
          name="story-list-role-disabled"
          value={value}
          disabled
          onValueChange={(next) => updateArgs({ value: next })}
        >
          <SelectListOption value="viewer" label="Viewer" />
          <SelectListOption
            value="editor"
            label="Contributor"
            description="Selection locked while saving."
          />
        </SelectList>
      </StoryFrame>
    );
  },
};
