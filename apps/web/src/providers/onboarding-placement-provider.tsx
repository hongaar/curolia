/* eslint-disable react-refresh/only-export-components -- provider module exports hook */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OnboardingPlacementContextValue = {
  awaitingPinPlacement: boolean;
  pinPlacedDuringOnboarding: boolean;
  beginPinPlacement: () => void;
  completePinPlacement: () => void;
  cancelPinPlacement: () => void;
  acknowledgePinPlaced: () => void;
};

const OnboardingPlacementContext =
  createContext<OnboardingPlacementContextValue | null>(null);

export function OnboardingPlacementProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [awaitingPinPlacement, setAwaitingPinPlacement] = useState(false);
  const [pinPlacedDuringOnboarding, setPinPlacedDuringOnboarding] =
    useState(false);

  const beginPinPlacement = useCallback(() => {
    setAwaitingPinPlacement(true);
    setPinPlacedDuringOnboarding(false);
  }, []);

  const completePinPlacement = useCallback(() => {
    setAwaitingPinPlacement(false);
    setPinPlacedDuringOnboarding(true);
  }, []);

  const cancelPinPlacement = useCallback(() => {
    setAwaitingPinPlacement(false);
    setPinPlacedDuringOnboarding(false);
  }, []);

  const acknowledgePinPlaced = useCallback(() => {
    setPinPlacedDuringOnboarding(false);
  }, []);

  const value = useMemo<OnboardingPlacementContextValue>(
    () => ({
      awaitingPinPlacement,
      pinPlacedDuringOnboarding,
      beginPinPlacement,
      completePinPlacement,
      cancelPinPlacement,
      acknowledgePinPlaced,
    }),
    [
      awaitingPinPlacement,
      pinPlacedDuringOnboarding,
      beginPinPlacement,
      completePinPlacement,
      cancelPinPlacement,
      acknowledgePinPlaced,
    ],
  );

  return (
    <OnboardingPlacementContext.Provider value={value}>
      {children}
    </OnboardingPlacementContext.Provider>
  );
}

export function useOnboardingPlacement() {
  const ctx = useContext(OnboardingPlacementContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingPlacement must be used within OnboardingPlacementProvider",
    );
  }
  return ctx;
}
