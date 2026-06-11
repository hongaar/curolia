import type { Meta, StoryObj } from "@storybook/react";
import {
  Compass,
  Layers,
  MapPin,
  Newspaper,
  Puzzle,
  Search,
  Share2,
  Sparkles,
  Tags,
} from "lucide-react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  OnboardingBody,
  OnboardingDescription,
  OnboardingDialog,
  OnboardingEyebrow,
  OnboardingFeatureGrid,
  OnboardingFeatureItem,
  OnboardingFooter,
  OnboardingHero,
  OnboardingPluginList,
  OnboardingPluginRow,
  OnboardingTitle,
  type OnboardingTone,
} from "./onboarding";

const TONES: OnboardingTone[] = ["brand", "sky", "amber", "violet", "rose"];

const ICONS = [
  <Compass key="c" aria-hidden />,
  <Layers key="l" aria-hidden />,
  <MapPin key="m" aria-hidden />,
  <Sparkles key="s" aria-hidden />,
  <Puzzle key="p" aria-hidden />,
];

const meta = {
  title: "Onboarding",
  ...componentStoryMeta(
    "First-run guided tour shown once after a user's first sign in.",
    "Compose `OnboardingDialog` with `OnboardingHero`, `OnboardingBody` and `OnboardingFooter`. Drive the step index and `tone` from the consumer; the footer renders the progress dots and navigation buttons.",
  ),
  component: OnboardingDialog,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const FullTour: Story = {
  parameters: storyDocs("Five-step welcome tour with per-step tone."),
  args: { open: true, step: 0 },
  render: function Render() {
    const [{ open, step }, updateArgs] = useStoryArgs<{
      open: boolean;
      step: number;
    }>();
    const total = 5;
    const goTo = (next: number) =>
      updateArgs({ step: Math.min(Math.max(next, 0), total - 1) });

    return (
      <>
        <Button variant="outline" onClick={() => updateArgs({ open: true })}>
          Open onboarding
        </Button>
        <OnboardingDialog
          open={open}
          onOpenChange={(next) => updateArgs({ open: next })}
          tone={TONES[step]}
          aria-label="Welcome to Curolia"
        >
          <OnboardingHero
            icon={ICONS[step]}
            onSkip={() => updateArgs({ open: false })}
          />
          <OnboardingBody>
            {step === 0 ? (
              <>
                <OnboardingEyebrow>Welcome</OnboardingEyebrow>
                <OnboardingTitle>Welcome to Curolia</OnboardingTitle>
                <OnboardingDescription>
                  Save the places that matter as pins, group them into maps, and
                  revisit your journeys together.
                </OnboardingDescription>
              </>
            ) : null}
            {step === 1 ? (
              <>
                <OnboardingEyebrow>Maps &amp; pins</OnboardingEyebrow>
                <OnboardingTitle>Everything lives on a map</OnboardingTitle>
                <OnboardingDescription>
                  A map is a collection of pins. Each pin is a place with notes,
                  tags, photos and dates.
                </OnboardingDescription>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <OnboardingEyebrow>Your first pin</OnboardingEyebrow>
                <OnboardingTitle>Drop your first pin</OnboardingTitle>
                <OnboardingDescription>
                  Search for a place in the toolbar, pick it from the list, then
                  tap Add pin.
                </OnboardingDescription>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <OnboardingEyebrow>Core features</OnboardingEyebrow>
                <OnboardingTitle>Make it your own</OnboardingTitle>
                <OnboardingFeatureGrid>
                  <OnboardingFeatureItem
                    icon={<Tags aria-hidden />}
                    title="Tags & filters"
                  >
                    Color-code pins and filter the map.
                  </OnboardingFeatureItem>
                  <OnboardingFeatureItem
                    icon={<Newspaper aria-hidden />}
                    title="Map & blog views"
                  >
                    Switch between map and a chronological blog.
                  </OnboardingFeatureItem>
                  <OnboardingFeatureItem
                    icon={<Search aria-hidden />}
                    title="Search"
                  >
                    Jump to any pin or place instantly.
                  </OnboardingFeatureItem>
                  <OnboardingFeatureItem
                    icon={<Share2 aria-hidden />}
                    title="Share maps"
                  >
                    Invite friends or publish publicly.
                  </OnboardingFeatureItem>
                </OnboardingFeatureGrid>
              </>
            ) : null}
            {step === 4 ? (
              <>
                <OnboardingEyebrow>One more thing</OnboardingEyebrow>
                <OnboardingTitle>Supercharge pins with plugins</OnboardingTitle>
                <OnboardingDescription>
                  Plugins enrich your pins automatically with places, weather
                  and more.
                </OnboardingDescription>
                <OnboardingPluginList>
                  <OnboardingPluginRow
                    icon={<MapPin aria-hidden />}
                    name="Points of interest"
                  >
                    Auto-detect nearby places for each pin.
                  </OnboardingPluginRow>
                  <OnboardingPluginRow
                    icon={<Sparkles aria-hidden />}
                    name="Weather"
                  >
                    Attach forecasts to dated pins.
                  </OnboardingPluginRow>
                </OnboardingPluginList>
              </>
            ) : null}
          </OnboardingBody>
          <OnboardingFooter total={total} current={step} onSelectStep={goTo}>
            {step > 0 ? (
              <Button variant="ghost" onClick={() => goTo(step - 1)}>
                Back
              </Button>
            ) : null}
            {step === total - 1 ? (
              <Button onClick={() => updateArgs({ open: false })}>
                <Puzzle aria-hidden />
                Explore plugins
              </Button>
            ) : (
              <Button onClick={() => goTo(step + 1)}>
                {step === 0 ? "Take the tour" : "Next"}
              </Button>
            )}
          </OnboardingFooter>
        </OnboardingDialog>
      </>
    );
  },
};
