#!/usr/bin/env node
import { compareOutput, loadJsonFile, migrateFile, renderEntry, writeOutput } from "./index.js";
import type { AdapterName } from "jsx2md";
import { Command } from "commander";

interface RenderCommandOptions {
  readonly adapter?: AdapterName;
  readonly output?: string;
  readonly props?: string;
}

interface MigrateCommandOptions {
  readonly adapter?: AdapterName;
  readonly output?: string;
}

const program = new Command();

const parseAdapter = (value: string): AdapterName => {
  if (value === "markdown" || value === "gfm" || value === "github") {
    return value;
  }

  throw new Error(`Unsupported adapter: ${value}`);
};

program.name("jsx2md").description("Generate Markdown from JSX and TSX.").version("0.0.1");

program
  .command("render")
  .argument("<entry>", "TSX entry file")
  .option("-o, --output <file>", "output file, or - for stdout")
  .option("--adapter <adapter>", "markdown, gfm, or github", parseAdapter, "markdown")
  .option("--props <file>", "JSON props passed to a function default export")
  .action(async (entry: string, options: RenderCommandOptions) => {
    const props = options.props === undefined ? undefined : await loadJsonFile(options.props);
    const markdown = await renderEntry(entry, {
      adapter: options.adapter ?? "markdown",
      props,
    });
    await writeOutput(markdown, options.output === undefined ? {} : { output: options.output });
  });

program
  .command("check")
  .argument("<entry>", "TSX entry file")
  .requiredOption("-o, --output <file>", "file to compare with generated output")
  .option("--adapter <adapter>", "markdown, gfm, or github", parseAdapter, "markdown")
  .option("--props <file>", "JSON props passed to a function default export")
  .action(async (entry: string, options: RenderCommandOptions) => {
    if (options.output === undefined) {
      throw new Error("The check command requires --output.");
    }

    const props = options.props === undefined ? undefined : await loadJsonFile(options.props);
    const markdown = await renderEntry(entry, {
      adapter: options.adapter ?? "markdown",
      props,
    });
    const result = await compareOutput(markdown, options.output);
    if (!result.matches) {
      process.stderr.write(`${options.output} is out of date.\n`);
      process.stderr.write(result.diff);
      process.exitCode = 1;
    }
  });

program
  .command("migrate")
  .argument("<input>", "Markdown file to convert")
  .option("-o, --output <file>", "output TSX file, or - for stdout")
  .option("--adapter <adapter>", "markdown, gfm, or github", parseAdapter, "markdown")
  .action(async (input: string, options: MigrateCommandOptions) => {
    const diagnostics = await migrateFile(input, {
      adapter: options.adapter ?? "markdown",
      ...(options.output === undefined ? {} : { output: options.output }),
    });
    for (const diagnostic of diagnostics) {
      process.stderr.write(`${diagnostic}\n`);
    }
  });

try {
  await program.parseAsync();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
