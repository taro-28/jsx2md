import { spawnSync } from "node:child_process";

const buildResult = spawnSync("pnpm", ["-r", "--sort", "run", "build"], {
  stdio: "inherit",
});

if (buildResult.status !== 0) {
  throw new Error("Workspace build failed before linting.");
}

const result = spawnSync("oxlint", ["-c", ".oxlintrc.jsonc", "."], {
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;
