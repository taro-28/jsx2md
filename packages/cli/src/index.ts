import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { migrateMarkdown } from "@jsx2md/migrate";
import type { AdapterName } from "jsx2md";

const execFileAsync = promisify(execFile);

export interface RenderEntryOptions {
  readonly adapter?: AdapterName;
  readonly props?: unknown;
}

export interface OutputOptions {
  readonly output?: string;
}

export const renderEntry = async (
  entry: string,
  options: RenderEntryOptions = {},
): Promise<string> => {
  const runner = new URL("./entry-runner.js", import.meta.url);
  const props = options.props === undefined ? "-" : encodeProps(options.props);
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--import", "tsx", runner.pathname, resolve(entry), options.adapter ?? "markdown", props],
    {
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return stdout;
};

export const writeOutput = async (value: string, options: OutputOptions = {}): Promise<void> => {
  if (options.output === undefined || options.output === "-") {
    process.stdout.write(value);
    return;
  }

  await writeFile(resolve(options.output), value);
};

export const checkOutput = async (value: string, output: string): Promise<boolean> => {
  const expected = await readFile(resolve(output), "utf8");
  return expected === value;
};

export const migrateFile = async (
  input: string,
  options: OutputOptions & { readonly adapter?: AdapterName } = {},
): Promise<readonly string[]> => {
  const source = await readFile(resolve(input), "utf8");
  const result = migrateMarkdown(
    source,
    options.adapter === undefined ? {} : { adapter: options.adapter },
  );
  await writeOutput(result.code, options);
  return result.diagnostics;
};

export const loadJsonFile = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(resolve(path), "utf8")) as unknown;

const encodeProps = (props: unknown): string =>
  Buffer.from(JSON.stringify(props), "utf8").toString("base64url");
