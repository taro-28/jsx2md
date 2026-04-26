import type { Adapter, AdapterFeature, MarkdownNode } from "./types.js";
import { isElement } from "./runtime.js";

export interface RenderContext {
  readonly adapter: Adapter;
  readonly headingLevel: number;
}

export type RenderMode = "block" | "inline";

export const isMarkdownNodeArray = (node: MarkdownNode): node is readonly MarkdownNode[] =>
  Array.isArray(node);

const isMarkdownNode = (value: unknown): value is MarkdownNode => {
  if (value === null || value === undefined) {
    return true;
  }

  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") {
    return true;
  }

  return (
    isElement(value) || (Array.isArray(value) && value.every((child) => isMarkdownNode(child)))
  );
};

export const childrenToArray = (children: MarkdownNode): MarkdownNode[] => {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (isMarkdownNodeArray(children)) {
    return children.flatMap((child) => childrenToArray(child));
  }

  return [children];
};

export const joinBlocks = (blocks: readonly string[]): string =>
  blocks
    .map((block) => block.trimEnd())
    .filter((block) => block.length > 0)
    .join("\n\n");

export const incrementHeading = (context: RenderContext): RenderContext => ({
  ...context,
  headingLevel: context.headingLevel + 1,
});

export const requireFeature = (
  context: RenderContext,
  feature: AdapterFeature,
  componentName: string,
): void => {
  if (!context.adapter.features.has(feature)) {
    throw new Error(
      `${componentName} requires the ${feature} feature, but the ${context.adapter.name} adapter does not support it.`,
    );
  }
};

export const stringProp = (
  props: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined => {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
};

export const markdownProp = (
  props: Readonly<Record<string, unknown>>,
  key: string,
): MarkdownNode => {
  const value = props[key];
  return isMarkdownNode(value) ? value : undefined;
};

export const isHeadingType = (value: string): boolean => /^h[1-6]$/.test(value);

export const isBlockNode = (node: MarkdownNode): boolean =>
  isElement(node) &&
  typeof node.type === "string" &&
  (blockElementTypes.has(node.type) || isHeadingType(node.type));

const blockElementTypes = new Set([
  "blockquote",
  "doc",
  "fragment",
  "heading-auto",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "thead",
  "tr",
  "ul",
]);
