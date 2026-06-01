import { NpmLicensesFullList } from "@/components/about/npm-licenses-full-list";
import { OpenSourceLicensesPageContent } from "@curolia/ui/landing-page";

export function OpenSourceLicensesPage() {
  return (
    <OpenSourceLicensesPageContent npmLicenses={<NpmLicensesFullList />} />
  );
}
