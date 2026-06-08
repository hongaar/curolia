/* eslint-disable react-refresh/only-export-components -- Provider module also exports useNavigationShell */
import { NewMapDialog } from "@/components/layout/new-map-dialog";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NavigationShellContextValue = {
  openNewMapDialog: () => void;
};

const NavigationShellContext =
  createContext<NavigationShellContextValue | null>(null);

export function NavigationShellProvider({ children }: { children: ReactNode }) {
  const [newMapOpen, setNewMapOpen] = useState(false);

  const openNewMapDialog = useCallback(() => {
    setNewMapOpen(true);
  }, []);

  const value = useMemo(
    (): NavigationShellContextValue => ({
      openNewMapDialog,
    }),
    [openNewMapDialog],
  );

  return (
    <NavigationShellContext.Provider value={value}>
      {children}
      <NewMapDialog open={newMapOpen} onOpenChange={setNewMapOpen} />
    </NavigationShellContext.Provider>
  );
}

export function useNavigationShell(): NavigationShellContextValue {
  const ctx = useContext(NavigationShellContext);
  if (!ctx) {
    throw new Error(
      "useNavigationShell must be used inside NavigationShellProvider",
    );
  }
  return ctx;
}
