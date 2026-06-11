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

export type GlobalSearchPlaceContextValue = {
  selectedPlace: PlaceSearchResult | null;
  selectPlace: (place: PlaceSearchResult) => void;
  clearSelectedPlace: () => void;
  requestAddPinFromSelectedPlace: () => void;
  registerAddPinFromPlaceHandler: (
    handler: AddPinFromPlaceHandler | null,
  ) => void;
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
    }),
    [
      selectedPlace,
      selectPlace,
      clearSelectedPlace,
      requestAddPinFromSelectedPlace,
      registerAddPinFromPlaceHandler,
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
