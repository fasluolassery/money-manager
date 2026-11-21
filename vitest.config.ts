import { defineConfig } from "vitest/config";

const workspace = (name: string, root: string, exclude: string[] = []) => ({
  extends: true,
  test: { name, root, exclude },
});

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    projects: [
      workspace("shared", "packages/shared"),
      // API integration tests (`*.api.test.ts`) run via `pnpm test:api` (issue #10).
      workspace("api", "apps/api", ["src/**/*.api.test.ts"]),
      { extends: true, test: { name: "web", root: "apps/web", environment: "jsdom" } },
    ],
    coverage: {
      provider: "v8",
      include: ["**/*.domain.ts"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
