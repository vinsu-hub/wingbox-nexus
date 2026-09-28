import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts, which sets root: "client" for
// the frontend dev server — that root would otherwise make vitest miss
// every test under server/. This repo's tests live next to the code they
// cover (server/**/*.test.ts), not in a separate top-level tests/ dir.
export default defineConfig({
  test: {
    include: ["server/**/*.test.ts"],
    testTimeout: 20000,
  },
});
