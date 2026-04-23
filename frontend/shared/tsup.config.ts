import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  dts: false, // IMPORTANT: disable tsup DTS
  tsconfig: "./tsconfig.json"
});