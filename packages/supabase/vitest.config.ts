import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["supabase/functions/link-metadata/lib/**/*.test.ts"],
  },
});
