import { useEffect, useRef, type RefObject } from "react";

import {
  BOTTOM_SHEET_HISTORY_STATE,
  isBottomSheetHistoryState,
} from "./bottom-sheet-history";

/** Push a history entry while open so browser / hardware back closes the sheet. */
export function useBottomSheetHistory(
  open: boolean,
  dismiss: () => void,
  enabled = true,
  /** Set by programmatic `dismiss()` so cleanup can clear programmatic flag. */
  programmaticDismissRef?: RefObject<boolean>,
) {
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    if (!open || !enabled) return;

    const stateBeforePush = window.history.state;
    if (!isBottomSheetHistoryState(window.history.state)) {
      window.history.pushState(BOTTOM_SHEET_HISTORY_STATE, "");
    }
    let pushed = true;

    const onPopState = () => {
      pushed = false;
      dismissRef.current();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (pushed && isBottomSheetHistoryState(window.history.state)) {
        window.history.replaceState(stateBeforePush ?? {}, "");
      }
      if (programmaticDismissRef?.current) {
        programmaticDismissRef.current = false;
      }
    };
  }, [open, enabled, programmaticDismissRef]);
}

export { isBottomSheetHistoryState };
