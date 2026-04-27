import { type AdapterName, type MarkdownNode, type UnsupportedBehavior, render } from "jsx2md";
import { pathToFileURL } from "node:url";

const isAdapterName = (value: string): value is AdapterName =>
  value === "markdown" || value === "gfm" || value === "github";

const isUnsupportedBehavior = (value: string): value is UnsupportedBehavior =>
  value === "error" || value === "plain" || value === "omit";

const resolveDefaultExport = async (
  exportedValue: unknown,
  value: unknown,
): Promise<MarkdownNode> => {
  if (typeof exportedValue !== "function") {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- render() validates unsupported nodes as empty output at runtime.
    return exportedValue as MarkdownNode;
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CLI function entries intentionally accept caller-provided JSON props.
  const entryFunction = exportedValue as (props: unknown) => MarkdownNode | Promise<MarkdownNode>;
  const node = await entryFunction(value);
  return node;
};

const unwrapDefault = (value: unknown): unknown => {
  if (
    typeof value === "object" &&
    value !== null &&
    "default" in value &&
    Object.keys(value).length === 1
  ) {
    return (value as { readonly default?: unknown }).default;
  }

  return value;
};

const [entry, adapter, encodedProps, unsupported] = process.argv.slice(2);

if (
  entry === undefined ||
  adapter === undefined ||
  encodedProps === undefined ||
  unsupported === undefined
) {
  throw new Error("entry-runner requires entry, adapter, props, and unsupported arguments.");
}

if (!isAdapterName(adapter)) {
  throw new Error(`Unsupported adapter: ${adapter}`);
}

if (!isUnsupportedBehavior(unsupported)) {
  throw new Error(`Unsupported unsupported behavior: ${unsupported}`);
}

const props =
  encodedProps === "-"
    ? undefined
    : (JSON.parse(Buffer.from(encodedProps, "base64url").toString("utf8")) as unknown);
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TSX entries are arbitrary modules and the CLI only reads their default export.
const loadedModule = (await import(pathToFileURL(entry).href)) as {
  readonly default?: unknown;
};
const defaultExport = unwrapDefault(loadedModule.default);

if (defaultExport === undefined) {
  throw new Error(`Entry ${entry} does not have a default export.`);
}

const node = await resolveDefaultExport(defaultExport, props);
process.stdout.write(render(node, { adapter, unsupported }));
