import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
