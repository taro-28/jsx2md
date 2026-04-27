import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const packDirectory = new URL(".tmp/packs/", root);

const packages = [
  {
    directory: "packages/core",
    files: ["package/dist/index.js", "package/dist/jsx-runtime.js", "package/README.md"],
    name: "jsx2md",
  },
  {
    directory: "packages/github",
    files: ["package/dist/index.js", "package/README.md"],
    name: "@jsx2md/github",
  },
  {
    directory: "packages/gfm",
    files: ["package/dist/index.js", "package/README.md"],
    name: "@jsx2md/gfm",
  },
  {
    directory: "packages/migrate",
    files: ["package/dist/index.js", "package/README.md"],
    name: "@jsx2md/migrate",
  },
  {
    directory: "packages/cli",
    files: ["package/dist/cli.js", "package/dist/index.js", "package/README.md"],
    name: "@jsx2md/cli",
  },
];

rmSync(packDirectory, { force: true, recursive: true });
mkdirSync(packDirectory, { recursive: true });

for (const packageInfo of packages) {
  const before = new Set(readdirSync(packDirectory));
  const result = spawnSync(
    "pnpm",
    ["--dir", packageInfo.directory, "pack", "--pack-destination", packDirectory.pathname],
    {
      cwd: root.pathname,
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`Failed to pack ${packageInfo.name}.`);
  }

  const after = readdirSync(packDirectory);
  const packed = after.find((file) => !before.has(file) && file.endsWith(".tgz"));
  if (packed === undefined) {
    throw new Error(`Pack smoke test did not produce a tarball for ${packageInfo.name}.`);
  }

  const tarball = new URL(packed, packDirectory);
  const tarResult = spawnSync("tar", ["-tf", tarball.pathname], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (tarResult.status !== 0) {
    process.stderr.write(tarResult.stderr);
    throw new Error(`Failed to inspect ${packed}.`);
  }

  for (const file of ["package/package.json", ...packageInfo.files]) {
    if (!tarResult.stdout.split("\n").includes(file)) {
      throw new Error(`${packed} does not include ${file}.`);
    }
  }
}

process.stdout.write(`Packed ${packages.length} packages into ${packDirectory.pathname}\n`);
