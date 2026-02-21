import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@listwell/shared": path.resolve(__dirname, "../..", "packages/shared/src/index.ts"),
      "@listwell/db/schema": path.resolve(__dirname, "../..", "packages/db/src/schema.ts"),
      "@listwell/db": path.resolve(__dirname, "../..", "packages/db/src/index.ts"),
    },
  },
});
