import { NpmLicensesFullList } from "@/components/about/npm-licenses-full-list";
import { OpenSourceLicensesPageContent } from "@curolia/site/pages";

export function OpenSourceLicensesPage() {
  return (
    <OpenSourceLicensesPageContent npmLicenses={<NpmLicensesFullList />} />
  );
}
