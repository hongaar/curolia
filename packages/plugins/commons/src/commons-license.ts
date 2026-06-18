/** CC0, public domain, CC BY, CC BY-SA — excludes NC/ND and non-free terms. */
export function isAllowedCommonsLicense(licenseShortName: string): boolean {
  const s = licenseShortName.toLowerCase();
  if (
    s.includes("fair use") ||
    s.includes("copyrighted") ||
    s.includes("all rights reserved") ||
    s.includes("non-free") ||
    s.includes("non free")
  ) {
    return false;
  }
  if (
    s.includes("-nc") ||
    s.includes(" non-commercial") ||
    s.includes(" non commercial") ||
    s.includes("-nd") ||
    s.includes(" no derivatives") ||
    s.includes("no derivative")
  ) {
    return false;
  }
  if (s.includes("cc0") || s.includes("cc zero")) return true;
  if (s.includes("public domain") || s.includes("pd-")) return true;
  if (s.includes("cc by-sa") || s.includes("cc-by-sa")) return true;
  if (s.includes("cc by") || s.includes("cc-by")) return true;
  if (s.includes("creative commons attribution")) return true;
  return false;
}
