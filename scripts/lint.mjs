import { spawnSync } from "node:child_process";

const allowedRules = [
  "complexity",
  "consistent-type-imports",
  "exports-last",
  "first",
  "func-style",
  "group-exports",
  "id-length",
  "import/no-default-export",
  "import/no-named-export",
  "import/no-nodejs-modules",
  "import/no-relative-parent-imports",
  "import/prefer-default-export",
  "jest/max-expects",
  "jest/no-conditional-in-test",
  "jest/prefer-lowercase-title",
  "jest/prefer-strict-equal",
  "jest/require-hook",
  "jsdoc/check-tag-names",
  "max-lines",
  "max-lines-per-function",
  "max-statements",
  "new-cap",
  "no-array-callback-reference",
  "no-array-sort",
  "no-await-in-loop",
  "no-base-to-string",
  "no-confusing-void-expression",
  "no-console",
  "no-default-export",
  "no-deprecated",
  "no-duplicate-imports",
  "no-empty-interface",
  "no-empty-object-type",
  "no-magic-numbers",
  "no-namespace",
  "no-nested-ternary",
  "no-null",
  "no-shadow",
  "no-ternary",
  "no-undefined",
  "no-unnecessary-boolean-literal-compare",
  "no-unnecessary-condition",
  "no-unnecessary-type-arguments",
  "no-unnecessary-type-assertion",
  "no-unnecessary-type-conversion",
  "no-unsafe-argument",
  "no-unsafe-type-assertion",
  "no-use-before-define",
  "prefer-describe-function-title",
  "prefer-destructuring",
  "prefer-readonly-parameter-types",
  "prefer-string-raw",
  "prefer-to-be-falsy",
  "prefer-to-be-truthy",
  "prefer-top-level-await",
  "prefer-await-to-callbacks",
  "prefer-await-to-then",
  "relative-url-style",
  "require-await",
  "require-test-timeout",
  "sort-imports",
  "strict-void-return",
  "unicorn/no-nested-ternary",
  "vitest/no-importing-vitest-globals",
];

const args = [
  "-D",
  "all",
  "-D",
  "nursery",
  "--type-aware",
  "--type-check",
  ...allowedRules.flatMap((rule) => ["-A", rule]),
  ".",
];

const buildResult = spawnSync("pnpm", ["-r", "--sort", "run", "build"], {
  stdio: "inherit",
});

if (buildResult.status !== 0) {
  throw new Error("Workspace build failed before linting.");
}

const result = spawnSync("oxlint", args, {
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;
