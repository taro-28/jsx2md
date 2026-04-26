import { readFile, writeFile } from "node:fs/promises";
import type { AdapterName } from "jsx2md";
import { execFile } from "node:child_process";
import { migrateMarkdown } from "@jsx2md/migrate";
import { promisify } from "node:util";
import { resolve } from "node:path";

// oxlint-disable-next-line typescript/strict-void-return -- Node's execFile overload is compatible with util.promisify at runtime.
const execFileAsync = promisify(execFile);

export interface RenderEntryOptions {
  readonly adapter?: AdapterName;
  readonly props?: unknown;
}

export interface OutputOptions {
  readonly output?: string;
}

export interface CheckOutputResult {
  readonly diff: string;
  readonly matches: boolean;
}

export const renderEntry = async (
  entry: string,
  options: RenderEntryOptions = {},
): Promise<string> => {
  const runner = new URL("entry-runner.js", import.meta.url);
  const resolvedEntry = resolve(entry);
  const props = options.props === undefined ? "-" : encodeProps(options.props);

  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", runner.pathname, resolvedEntry, options.adapter ?? "markdown", props],
      {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    return stdout;
  } catch (error) {
    throw renderEntryError(error, resolvedEntry);
  }
};

export const writeOutput = async (value: string, options: OutputOptions = {}): Promise<void> => {
  if (options.output === undefined || options.output === "-") {
    process.stdout.write(value);
    return;
  }

  await writeFile(resolve(options.output), value);
};

export const checkOutput = async (value: string, output: string): Promise<boolean> => {
  const result = await compareOutput(value, output);
  return result.matches;
};

export const compareOutput = async (value: string, output: string): Promise<CheckOutputResult> => {
  const expected = await readFile(resolve(output), "utf8");
  const matches = expected === value;
  return {
    diff: matches
      ? ""
      : formatUnifiedDiff({
          actual: value,
          actualLabel: "generated",
          expected,
          expectedLabel: output,
        }),
    matches,
  };
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

interface UnifiedDiffOptions {
  readonly actual: string;
  readonly actualLabel: string;
  readonly expected: string;
  readonly expectedLabel: string;
}

const formatUnifiedDiff = ({
  actual,
  actualLabel,
  expected,
  expectedLabel,
}: UnifiedDiffOptions): string => {
  const expectedLines = diffLines(expected);
  const actualLines = diffLines(actual);
  const window = diffWindow(expectedLines, actualLines);
  const lines = [
    ...diffHeader(expectedLabel, actualLabel, window),
    ...diffBody(expectedLines, actualLines, window),
  ];

  return `${lines.join("\n")}\n`;
};

interface DiffWindow {
  readonly actualChangeEnd: number;
  readonly actualContextEnd: number;
  readonly contextStart: number;
  readonly expectedChangeEnd: number;
  readonly expectedContextEnd: number;
  readonly prefixLength: number;
}

const diffWindow = (
  expectedLines: readonly string[],
  actualLines: readonly string[],
): DiffWindow => {
  const prefixLength = commonPrefixLength(expectedLines, actualLines);
  const suffixLength = commonSuffixLength(expectedLines, actualLines, prefixLength);
  const contextLength = 3;
  const expectedChangeEnd = expectedLines.length - suffixLength;
  const actualChangeEnd = actualLines.length - suffixLength;
  return {
    actualChangeEnd,
    actualContextEnd: Math.min(actualLines.length, actualChangeEnd + contextLength),
    contextStart: Math.max(0, prefixLength - contextLength),
    expectedChangeEnd,
    expectedContextEnd: Math.min(expectedLines.length, expectedChangeEnd + contextLength),
    prefixLength,
  };
};

const diffHeader = (
  expectedLabel: string,
  actualLabel: string,
  window: DiffWindow,
): readonly string[] => [
  `--- ${expectedLabel}`,
  `+++ ${actualLabel}`,
  `@@ -${String(window.contextStart + 1)},${String(
    window.expectedContextEnd - window.contextStart,
  )} +${String(window.contextStart + 1)},${String(
    window.actualContextEnd - window.contextStart,
  )} @@`,
];

const diffBody = (
  expectedLines: readonly string[],
  actualLines: readonly string[],
  window: DiffWindow,
): readonly string[] => [
  ...expectedLines.slice(window.contextStart, window.prefixLength).map((line) => ` ${line}`),
  ...expectedLines.slice(window.prefixLength, window.expectedChangeEnd).map((line) => `-${line}`),
  ...actualLines.slice(window.prefixLength, window.actualChangeEnd).map((line) => `+${line}`),
  ...expectedLines
    .slice(window.expectedChangeEnd, window.expectedContextEnd)
    .map((line) => ` ${line}`),
];

const diffLines = (value: string): readonly string[] => {
  if (value.length === 0) {
    return [];
  }

  const hasTrailingLineBreak = value.endsWith("\n");
  const content = hasTrailingLineBreak ? value.slice(0, -1) : value;
  const lines = content.length === 0 ? [] : content.split("\n");
  return hasTrailingLineBreak ? lines : [...lines, String.raw`\ No newline at end of file`];
};

const commonPrefixLength = (left: readonly string[], right: readonly string[]): number => {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left[index] === right[index]) {
    index += 1;
  }

  return index;
};

const commonSuffixLength = (
  left: readonly string[],
  right: readonly string[],
  prefixLength: number,
): number => {
  const limit = Math.min(left.length, right.length) - prefixLength;
  let index = 0;
  while (index < limit && left[left.length - index - 1] === right[right.length - index - 1]) {
    index += 1;
  }

  return index;
};

interface ProcessError extends Error {
  readonly code?: number | string | null;
  readonly signal?: string | null;
  readonly stderr?: Buffer | string;
  readonly stdout?: Buffer | string;
}

const renderEntryError = (error: unknown, entry: string): Error => {
  const processError = error instanceof Error ? (error as ProcessError) : undefined;
  const stderr = stringifyOutput(processError?.stderr).trim();
  const stdout = stringifyOutput(processError?.stdout).trim();
  const detail = [stderr, stdout].filter((value) => value.length > 0).join("\n");
  const status =
    processError?.code === undefined || processError.code === null
      ? ""
      : ` Exit code: ${String(processError.code)}.`;
  const signal =
    processError?.signal === undefined || processError.signal === null
      ? ""
      : ` Signal: ${processError.signal}.`;
  const fallback = error instanceof Error ? error.message : String(error);
  const message = detail.length > 0 ? detail : fallback;
  return new Error(`Failed to render TSX entry ${entry}.${status}${signal}\n${message}`);
};

const stringifyOutput = (value: Buffer | string | undefined): string => {
  if (value === undefined) {
    return "";
  }

  return typeof value === "string" ? value : value.toString("utf8");
};
