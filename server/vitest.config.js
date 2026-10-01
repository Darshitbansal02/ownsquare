import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["src/**/*.test.js"], exclude: ["src/**/*.integration.test.js"] } },
      {
        test: {
          name: "integration", include: ["src/**/*.integration.test.js"],
          testTimeout: 60000, hookTimeout: 180000, fileParallelism: false
        }
      }
    ]
  }
});
