/* eslint-disable react-refresh/only-export-components -- Provider module also exports useNavigationShell */
import { AboutDialog } from "@/components/about/about-dialog";
import { NpmLicensesFullList } from "@/components/about/npm-licenses-full-list";
import { NewMapDialog } from "@/components/layout/new-map-dialog";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

export type NavigationShellContextValue = {
  openNewMapDialog: () => void;
  openAboutDialog: () => void;
};

const NavigationShellContext =
  createContext<NavigationShellContextValue | null>(null);

export function NavigationShellProvider({ children }: { children: ReactNode }) {
  const [newMapOpen, setNewMapOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const openNewMapDialog = useCallback(() => {
    setNewMapOpen(true);
  }, []);

  const openAboutDialog = useCallback(() => {
    setAboutOpen(true);
  }, []);

  const value = useMemo(
    (): NavigationShellContextValue => ({
      openNewMapDialog,
      openAboutDialog,
    }),
    [openNewMapDialog, openAboutDialog],
  );

  return (
    <NavigationShellContext.Provider value={value}>
      {children}
      <NewMapDialog open={newMapOpen} onOpenChange={setNewMapOpen} />
      <AboutDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        version={APP_VERSION}
        npmLicensesContent={<NpmLicensesFullList />}
      />
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
