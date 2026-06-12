import * as React from "react";

export const BottomSheetDismissContext = React.createContext<
  (() => void) | null
>(null);

export function useBottomSheetDismiss(): (() => void) | null {
  return React.useContext(BottomSheetDismissContext);
}
