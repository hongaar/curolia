/* eslint-disable react-refresh/only-export-components -- provider module exports hook */
import type { PlaceSearchResult } from "@curolia/services/geocoding";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AddPinFromPlaceHandler = (place: PlaceSearchResult) => void;
type PanelPinFocusHandler = (pinId: string) => void;

export type GlobalSearchPlaceContextValue = {
  selectedPlace: PlaceSearchResult | null;
  selectPlace: (place: PlaceSearchResult) => void;
  clearSelectedPlace: () => void;
  requestAddPinFromSelectedPlace: () => void;
  registerAddPinFromPlaceHandler: (
    handler: AddPinFromPlaceHandler | null,
  ) => void;
  requestPanelPinFocus: (pinId: string) => void;
  registerPanelPinFocusHandler: (handler: PanelPinFocusHandler | null) => void;
};

const GlobalSearchPlaceContext =
  createContext<GlobalSearchPlaceContextValue | null>(null);

export function GlobalSearchPlaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(
    null,
  );
  const addPinHandlerRef = useRef<AddPinFromPlaceHandler | null>(null);
  const panelPinFocusHandlerRef = useRef<PanelPinFocusHandler | null>(null);

  const selectPlace = useCallback((place: PlaceSearchResult) => {
    setSelectedPlace(place);
  }, []);

  const clearSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const registerAddPinFromPlaceHandler = useCallback(
    (handler: AddPinFromPlaceHandler | null) => {
      addPinHandlerRef.current = handler;
    },
    [],
  );

  const registerPanelPinFocusHandler = useCallback(
    (handler: PanelPinFocusHandler | null) => {
      panelPinFocusHandlerRef.current = handler;
    },
    [],
  );

  const requestPanelPinFocus = useCallback((pinId: string) => {
    panelPinFocusHandlerRef.current?.(pinId);
  }, []);

  const requestAddPinFromSelectedPlace = useCallback(() => {
    const place = selectedPlace;
    if (!place) return;
    addPinHandlerRef.current?.(place);
  }, [selectedPlace]);

  const value = useMemo(
    (): GlobalSearchPlaceContextValue => ({
      selectedPlace,
      selectPlace,
      clearSelectedPlace,
      requestAddPinFromSelectedPlace,
      registerAddPinFromPlaceHandler,
      requestPanelPinFocus,
      registerPanelPinFocusHandler,
    }),
    [
      selectedPlace,
      selectPlace,
      clearSelectedPlace,
      requestAddPinFromSelectedPlace,
      registerAddPinFromPlaceHandler,
      requestPanelPinFocus,
      registerPanelPinFocusHandler,
    ],
  );

  return (
    <GlobalSearchPlaceContext.Provider value={value}>
      {children}
    </GlobalSearchPlaceContext.Provider>
  );
}

export function useGlobalSearchPlace(): GlobalSearchPlaceContextValue {
  const ctx = useContext(GlobalSearchPlaceContext);
  if (!ctx) {
    throw new Error(
      "useGlobalSearchPlace must be used inside GlobalSearchPlaceProvider",
    );
  }
  return ctx;
}
