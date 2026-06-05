import type { Meta, StoryObj } from "@storybook/react";
import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Input } from "../input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import styles from "./popover.module.css";

const meta = {
  title: "Popover",
  ...componentStoryMeta(
    "Non-modal floating panel anchored to a trigger or custom anchor element.",
    "Use `PopoverTrigger` for buttons, or `PopoverAnchor` when the anchor is an input (toolbar search). Set `modal={false}` so focus stays in the field. Position via props on `PopoverContent`.",
  ),
  component: Popover,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Popover anchored to a trigger button."),
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open popover
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the size for the layer.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

type PositioningArgs = {
  side: "top" | "bottom" | "left" | "right";
  align: "start" | "center" | "end";
  sideOffset: number;
};

export const Positioning: StoryObj<PositioningArgs> = {
  parameters: storyDocs(
    "`side`, `align`, and `sideOffset` on `PopoverContent` control placement.",
  ),
  args: {
    side: "bottom",
    align: "start",
    sideOffset: 8,
  },
  argTypes: {
    side: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    sideOffset: { control: { type: "number", min: 0, max: 32 } },
  },
  render: function PositioningStory(args) {
    const { side, align, sideOffset } = args;
    return (
      <div className={styles.positioningDemo}>
        <Popover defaultOpen>
          <PopoverTrigger render={<Button variant="outline" />}>
            Anchor
          </PopoverTrigger>
          <PopoverContent side={side} align={align} sideOffset={sideOffset}>
            <PopoverHeader>
              <PopoverTitle>
                {side} / {align}
              </PopoverTitle>
              <PopoverDescription>
                sideOffset: {sideOffset}px
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

export const Controlled: Story = {
  parameters: storyDocs(
    "Controlled `open` with `onOpenChange` — same pattern as toolbar search.",
  ),
  render: function Render() {
    const [{ open }, updateArgs] = useStoryArgs<{ open: boolean }>();
    return (
      <Popover open={open} onOpenChange={(next) => updateArgs({ open: next })}>
        <PopoverTrigger render={<Button variant="outline" />}>
          {open ? "Close" : "Open"} popover
        </PopoverTrigger>
        <PopoverContent>
          <PopoverDescription>
            Controlled from Storybook args and the trigger.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    );
  },
  args: {
    open: false,
  },
};

export const AnchorInput: Story = {
  parameters: storyDocs(
    "Toolbar-style search: type in the anchor input; results open below. First click focuses the field; click outside dismisses.",
  ),
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function close() {
      setOpen(false);
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    }

    return (
      <Popover
        open={open}
        modal={false}
        onOpenChange={(next) => {
          if (!next) {
            close();
            return;
          }
          setOpen(true);
        }}
      >
        <PopoverAnchor className={styles.anchorInputRoot}>
          <div
            className={
              focused
                ? `${styles.anchorInputField} ${styles.anchorInputFieldFocused}`
                : styles.anchorInputField
            }
          >
            <span className={styles.anchorInputIcon} aria-hidden>
              <Search />
            </span>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setFocused(true);
                setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  close();
                }
              }}
              placeholder="Search…"
              aria-label="Search demo"
              aria-expanded={open}
              className={styles.anchorInputControl}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={8}
          className={styles.anchorInputPopover}
        >
          <PopoverTitle className="srOnly">Search results</PopoverTitle>
          <p className={styles.anchorInputHint}>
            {query.trim().length === 0
              ? "Type to search…"
              : `Results for “${query.trim()}”`}
          </p>
        </PopoverContent>
      </Popover>
    );
  },
};

export const Modal: Story = {
  parameters: storyDocs(
    "`modal` traps focus and blocks outside interaction (default `false` for toolbar search).",
  ),
  render: function Render() {
    const [{ modal }, updateArgs] = useStoryArgs<{ modal: boolean }>();
    return (
      <Popover modal={modal} defaultOpen onOpenChange={() => undefined}>
        <PopoverTrigger render={<Button variant="outline" />}>
          {modal ? "Modal on" : "Modal off"}
        </PopoverTrigger>
        <PopoverContent>
          <PopoverDescription>
            Toggle `modal` in controls. When true, focus is trapped inside the
            popover.
          </PopoverDescription>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => updateArgs({ modal: !modal })}
          >
            Toggle modal ({modal ? "on" : "off"})
          </Button>
        </PopoverContent>
      </Popover>
    );
  },
  args: {
    modal: false,
  },
};
