import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api-integration",
    root: ".",
    include: ["src/**/*.api.test.ts"],
    setupFiles: ["./src/test-support/api-setup.ts"],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
