/* eslint-disable react-refresh/only-export-components -- Provider module also exports useNavigationShell */
import { NewMapDialog } from "@/components/layout/new-map-dialog";
import { NAV_SIDEBAR_OPEN_STORAGE_KEY } from "@/lib/navigation-shell-layout";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type NavigationShellContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  openNewMapDialog: () => void;
};

const NavigationShellContext =
  createContext<NavigationShellContextValue | null>(null);

function readStoredSidebarOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(NAV_SIDEBAR_OPEN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function NavigationShellProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(readStoredSidebarOpen);
  const [newMapOpen, setNewMapOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        NAV_SIDEBAR_OPEN_STORAGE_KEY,
        sidebarOpen ? "1" : "0",
      );
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [sidebarOpen]);

  const openNewMapDialog = useCallback(() => {
    setNewMapOpen(true);
  }, []);

  const value = useMemo(
    (): NavigationShellContextValue => ({
      sidebarOpen,
      setSidebarOpen,
      openNewMapDialog,
    }),
    [sidebarOpen, openNewMapDialog],
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
