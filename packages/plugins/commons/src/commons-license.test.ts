import { describe, expect, it } from "vitest";
import { isAllowedCommonsLicense } from "./commons-license";

describe("isAllowedCommonsLicense", () => {
  it("allows CC BY and CC BY-SA", () => {
    expect(isAllowedCommonsLicense("CC BY 4.0")).toBe(true);
    expect(isAllowedCommonsLicense("CC BY-SA 2.0")).toBe(true);
  });

  it("allows CC0 and public domain", () => {
    expect(isAllowedCommonsLicense("CC0")).toBe(true);
    expect(isAllowedCommonsLicense("Public domain")).toBe(true);
  });

  it("rejects NC and ND licenses", () => {
    expect(isAllowedCommonsLicense("CC BY-NC 4.0")).toBe(false);
    expect(isAllowedCommonsLicense("CC BY-ND 2.0")).toBe(false);
    expect(isAllowedCommonsLicense("CC BY-NC-SA 3.0")).toBe(false);
  });

  it("rejects non-free terms", () => {
    expect(isAllowedCommonsLicense("Fair use")).toBe(false);
    expect(isAllowedCommonsLicense("Copyrighted free use")).toBe(false);
  });
});
