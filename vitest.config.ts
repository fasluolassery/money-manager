import { defineConfig } from "vitest/config";

const workspace = (name: string, root: string) => ({ extends: true, test: { name, root } });

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    projects: [
      workspace("shared", "packages/shared"),
      workspace("api", "apps/api"),
      workspace("web", "apps/web"),
    ],
    coverage: {
      provider: "v8",
      include: ["**/*.domain.ts"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
