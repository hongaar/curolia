import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "../plugins/*/supabase/functions/**/*.test.ts",
      "supabase/functions/link-metadata/**/*.test.ts",
    ],
  },
});
