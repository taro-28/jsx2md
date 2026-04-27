import type { DefinitionContent, Html, PhrasingContent, RootContent } from "mdast";
import type { MigrationState } from "./state.js";
import { toMarkdown } from "mdast-util-to-markdown";

type PreservedNode = DefinitionContent | PhrasingContent | RootContent;

export const rawToTsx = (node: Html, state: MigrationState, label: string): string => {
  state.diagnostics.push(`Preserved ${label} as RawMarkdown.`);
  return `<RawMarkdown>{${JSON.stringify(rawSource(node, state))}}</RawMarkdown>`;
};

export const unknownToTsx = (node: PreservedNode, state: MigrationState): string => {
  state.diagnostics.push(`Preserved unsupported ${node.type} node as RawMarkdown.`);
  return `<RawMarkdown>{${JSON.stringify(rawSource(node, state))}}</RawMarkdown>`;
};

export const wrap = (tag: string, body: string): string =>
  body.length === 0 ? `<${tag} />` : `<${tag}>${body}</${tag}>`;

export const quoteAttribute = (value: string): string => JSON.stringify(value);

export const indent = (value: string, spaces: number): string => {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
};

const rawSource = (node: PreservedNode, state: MigrationState): string => {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (typeof start === "number" && typeof end === "number" && start >= 0 && end >= start) {
    return state.source.slice(start, end);
  }

  return toMarkdown(node);
};
