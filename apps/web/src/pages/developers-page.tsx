import { publicApiBaseUrl } from "@/lib/public-api";
import { DevelopersPageContent } from "@curolia/site/pages";

export function DevelopersPage() {
  return <DevelopersPageContent apiBaseUrl={publicApiBaseUrl()} />;
}
