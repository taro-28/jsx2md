import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// oxlint-disable-next-line import/no-default-export -- Vitest requires a default config export.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "jsx2md/jsx-dev-runtime",
        replacement: fromRoot("./packages/core/src/jsx-dev-runtime.ts"),
      },
      {
        find: "jsx2md/jsx-runtime",
        replacement: fromRoot("./packages/core/src/jsx-runtime.ts"),
      },
      {
        find: "@jsx2md/cli",
        replacement: fromRoot("./packages/cli/src/index.ts"),
      },
      {
        find: "@jsx2md/github",
        replacement: fromRoot("./packages/github/src/index.ts"),
      },
      {
        find: "@jsx2md/migrate",
        replacement: fromRoot("./packages/migrate/src/index.ts"),
      },
      {
        find: "jsx2md",
        replacement: fromRoot("./packages/core/src/index.ts"),
      },
    ],
  },
  test: {
    include: ["packages/*/test/**/*.test.{ts,tsx}"],
  },
});
