import { mapAddPinHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from "@/lib/onboarding-storage";
import { pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { useOnboardingPlacement } from "@/providers/onboarding-placement-provider";
import { Button } from "@curolia/ui/button";
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
} from "@curolia/ui/onboarding";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type StepId = "welcome" | "maps" | "first-pin" | "features" | "plugins";

const STEP_ORDER: readonly StepId[] = [
  "welcome",
  "maps",
  "first-pin",
  "features",
  "plugins",
];

const STEP_TONE: Record<StepId, OnboardingTone> = {
  welcome: "brand",
  maps: "sky",
  "first-pin": "amber",
  features: "violet",
  plugins: "rose",
};

const STEP_ICON: Record<StepId, ReactNode> = {
  welcome: <Compass aria-hidden />,
  maps: <Layers aria-hidden />,
  "first-pin": <MapPin aria-hidden />,
  features: <Sparkles aria-hidden />,
  plugins: <Puzzle aria-hidden />,
};

const FEATURES_STEP_INDEX = STEP_ORDER.indexOf("features");

export function OnboardingTour() {
  const { user } = useAuth();
  const { activeMap, maps, loading } = useMap();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    awaitingPinPlacement,
    pinPlacedDuringOnboarding,
    beginPinPlacement,
    acknowledgePinPlaced,
    cancelPinPlacement,
  } = useOnboardingPlacement();

  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const onboardingQuery = useQuery({
    queryKey: ["onboarding-completed", user?.id],
    queryFn: () => getOnboardingCompleted(user!.id),
    enabled: Boolean(user),
  });

  const eligible =
    Boolean(user) &&
    !loading &&
    onboardingQuery.isSuccess &&
    !onboardingQuery.data;
  const placementInProgress = awaitingPinPlacement || pinPlacedDuringOnboarding;
  const open = eligible && !dismissed && !placementInProgress;

  const complete = () => {
    if (!user) return;
    cancelPinPlacement();
    setDismissed(true);
    queryClient.setQueryData(["onboarding-completed", user.id], true);
    void setOnboardingCompleted(user.id).catch((error: unknown) => {
      console.error("Failed to persist onboarding completion", error);
      queryClient.setQueryData(["onboarding-completed", user.id], false);
    });
  };

  useEffect(() => {
    if (!pinPlacedDuringOnboarding) return;
    const timer = window.setTimeout(() => {
      setStepIndex(FEATURES_STEP_INDEX);
      acknowledgePinPlaced();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [pinPlacedDuringOnboarding, acknowledgePinPlaced]);

  const stepId = STEP_ORDER[stepIndex];
  const isLast = stepIndex === STEP_ORDER.length - 1;
  const mapName = activeMap?.name ?? maps[0]?.name ?? "your first map";
  const placementMap = activeMap ?? maps[0] ?? null;

  const goNext = () => {
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  };
  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const dropFirstPin = () => {
    if (!placementMap?.slug || !placementMap.owner_profile_slug) return;
    beginPinPlacement();
    navigate(mapAddPinHref(mapRouteForMap(placementMap)));
  };

  const explorePlugins = () => {
    complete();
    navigate("/plugins");
  };

  const featuredPlugins = pluginList.filter((p) => p.implemented).slice(0, 3);

  return (
    <OnboardingDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !placementInProgress) complete();
      }}
      tone={STEP_TONE[stepId]}
      aria-label="Welcome to Curolia"
    >
      <OnboardingHero
        icon={STEP_ICON[stepId]}
        onSkip={complete}
        skipLabel="Skip"
      />

      <OnboardingBody>
        {stepId === "welcome" ? (
          <>
            <OnboardingEyebrow>Welcome</OnboardingEyebrow>
            <OnboardingTitle>Welcome to Curolia</OnboardingTitle>
            <OnboardingDescription>
              Curolia is your collaborative place-memory. Save the spots that
              matter as pins, group them into maps, and revisit your journeys
              together. This quick tour shows you the essentials in under a
              minute.
            </OnboardingDescription>
          </>
        ) : null}

        {stepId === "maps" ? (
          <>
            <OnboardingEyebrow>Maps &amp; pins</OnboardingEyebrow>
            <OnboardingTitle>Everything lives on a map</OnboardingTitle>
            <OnboardingDescription>
              You already have a map called &ldquo;{mapName}&rdquo;. A map is a
              collection of pins, and each pin is a place you care about &mdash;
              complete with notes, tags, photos and dates. Create as many maps
              as you like for trips, food, hikes and more.
            </OnboardingDescription>
          </>
        ) : null}

        {stepId === "first-pin" ? (
          <>
            <OnboardingEyebrow>Your first pin</OnboardingEyebrow>
            <OnboardingTitle>Drop your first pin</OnboardingTitle>
            <OnboardingDescription>
              Pins are the heart of Curolia. Tap the add button, search for a
              place, and pick it from the list &mdash; Curolia fills in the
              title and address automatically. Give it a try!
            </OnboardingDescription>
            {placementMap?.slug ? (
              <Button size="lg" onClick={dropFirstPin}>
                <MapPin aria-hidden />
                Drop my first pin
              </Button>
            ) : null}
          </>
        ) : null}

        {stepId === "features" ? (
          <>
            <OnboardingEyebrow>Core features</OnboardingEyebrow>
            <OnboardingTitle>Make it your own</OnboardingTitle>
            <OnboardingDescription>
              A few things to explore once you have some pins on the map:
            </OnboardingDescription>
            <OnboardingFeatureGrid>
              <OnboardingFeatureItem
                icon={<Tags aria-hidden />}
                title="Tags & filters"
              >
                Color-code pins with tags and filter the map to focus on what
                matters.
              </OnboardingFeatureItem>
              <OnboardingFeatureItem
                icon={<Newspaper aria-hidden />}
                title="Map & blog views"
              >
                Switch between the live map and a chronological blog of your
                pins.
              </OnboardingFeatureItem>
              <OnboardingFeatureItem
                icon={<Search aria-hidden />}
                title="Search"
              >
                Jump to any pin or place instantly with global search.
              </OnboardingFeatureItem>
              <OnboardingFeatureItem
                icon={<Share2 aria-hidden />}
                title="Share maps"
              >
                Invite friends to collaborate or publish a map to share
                publicly.
              </OnboardingFeatureItem>
            </OnboardingFeatureGrid>
          </>
        ) : null}

        {stepId === "plugins" ? (
          <>
            <OnboardingEyebrow>One more thing</OnboardingEyebrow>
            <OnboardingTitle>Supercharge pins with plugins</OnboardingTitle>
            <OnboardingDescription>
              Plugins enrich your pins automatically &mdash; pull in points of
              interest, weather, photos and music. Enable your first plugin to
              see Curolia do the work for you.
            </OnboardingDescription>
            {featuredPlugins.length > 0 ? (
              <OnboardingPluginList>
                {featuredPlugins.map((plugin) => {
                  const Icon = plugin.icon;
                  return (
                    <OnboardingPluginRow
                      key={plugin.id}
                      icon={<Icon size={4} />}
                      name={plugin.displayName}
                    >
                      {plugin.description}
                    </OnboardingPluginRow>
                  );
                })}
              </OnboardingPluginList>
            ) : null}
          </>
        ) : null}
      </OnboardingBody>

      <OnboardingFooter
        total={STEP_ORDER.length}
        current={stepIndex}
        onSelectStep={setStepIndex}
      >
        {stepIndex > 0 ? (
          <Button variant="ghost" onClick={goBack}>
            Back
          </Button>
        ) : null}
        {isLast ? (
          <>
            <Button variant="ghost" onClick={complete}>
              Finish
            </Button>
            <Button onClick={explorePlugins}>
              <Puzzle aria-hidden />
              Explore plugins
            </Button>
          </>
        ) : (
          <Button onClick={goNext}>
            {stepIndex === 0 ? "Take the tour" : "Next"}
          </Button>
        )}
      </OnboardingFooter>
    </OnboardingDialog>
  );
}
