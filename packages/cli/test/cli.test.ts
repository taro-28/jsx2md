import { checkOutput, compareOutput, loadJsonFile, migrateFile } from "@jsx2md/cli";
import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("CLI helpers", () => {
  it("loads JSON props", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jsx2md-cli-"));
    const propsPath = join(directory, "props.json");
    await writeFile(propsPath, JSON.stringify({ title: "Hello" }));

    await expect(loadJsonFile(propsPath)).resolves.toEqual({ title: "Hello" });
  });

  it("checks output equality", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jsx2md-cli-"));
    const outputPath = join(directory, "README.md");
    await writeFile(outputPath, "# Title\n");

    await expect(checkOutput("# Title\n", outputPath)).resolves.toBe(true);
    await expect(checkOutput("# Other\n", outputPath)).resolves.toBe(false);
  });

  it("returns a diff for output mismatches", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jsx2md-cli-"));
    const outputPath = join(directory, "README.md");
    await writeFile(outputPath, "# Title\n\nOld\n");

    await expect(compareOutput("# Title\n\nNew\n", outputPath)).resolves.toEqual({
      diff: [
        `--- ${outputPath}`,
        "+++ generated",
        "@@ -1,3 +1,3 @@",
        " # Title",
        " ",
        "-Old",
        "+New",
        "",
      ].join("\n"),
      matches: false,
    });
  });

  it("migrates Markdown files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jsx2md-cli-"));
    const inputPath = join(directory, "README.md");
    const outputPath = join(directory, "README.tsx");
    await writeFile(inputPath, "# Title\n");

    await expect(migrateFile(inputPath, { output: outputPath })).resolves.toEqual([]);
    await expect(readFile(outputPath, "utf8")).resolves.toContain('<h1>{"Title"}</h1>');
  });
});
