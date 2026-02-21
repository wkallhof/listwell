import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/migrate.ts"],
  format: ["esm"],
  dts: true,
  // Bundle workspace packages into the output so Node.js doesn't
  // try to load raw .ts files from packages/ at runtime
  noExternal: ["@listwell/db", "@listwell/shared"],
});
