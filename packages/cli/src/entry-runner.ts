import { pathToFileURL } from "node:url";
import { render } from "jsx2md";
import type { AdapterName, MarkdownNode } from "jsx2md";

const [entry, adapter, encodedProps] = process.argv.slice(2);

if (entry === undefined || adapter === undefined || encodedProps === undefined) {
  throw new Error("entry-runner requires entry, adapter, and props arguments.");
}

if (!isAdapterName(adapter)) {
  throw new Error(`Unsupported adapter: ${adapter}`);
}

const props =
  encodedProps === "-"
    ? undefined
    : (JSON.parse(Buffer.from(encodedProps, "base64url").toString("utf8")) as unknown);
const loaded = (await import(pathToFileURL(entry).href)) as {
  readonly default?: unknown;
};
const exported = unwrapDefault(loaded.default);

if (exported === undefined) {
  throw new Error(`Entry ${entry} does not have a default export.`);
}

const node = await resolveDefaultExport(exported, props);
process.stdout.write(render(node, { adapter }));

function isAdapterName(value: string): value is AdapterName {
  return value === "markdown" || value === "gfm" || value === "github";
}

async function resolveDefaultExport(exported: unknown, value: unknown): Promise<MarkdownNode> {
  if (typeof exported !== "function") {
    return exported as MarkdownNode;
  }

  const entryFunction = exported as (props: unknown) => MarkdownNode | Promise<MarkdownNode>;
  return entryFunction(value);
}

function unwrapDefault(value: unknown): unknown {
  if (
    typeof value === "object" &&
    value !== null &&
    "default" in value &&
    Object.keys(value).length === 1
  ) {
    return (value as { readonly default?: unknown }).default;
  }

  return value;
}
