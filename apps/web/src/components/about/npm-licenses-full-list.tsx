import { NPM_LICENSE_ENTRIES } from "@/generated/npm-licenses.gen";
import { NpmLicensesList } from "@curolia/ui/about-dialog";

export function NpmLicensesFullList() {
  return <NpmLicensesList entries={NPM_LICENSE_ENTRIES} />;
}
