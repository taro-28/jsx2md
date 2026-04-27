import type { ComponentContext, MarkdownElement, MarkdownNode, RenderOptions } from "./types.js";
import {
  type RenderContext,
  type RenderMode,
  childrenToArray,
  incrementHeading,
  isHeadingType,
  isMarkdownNodeArray,
  joinBlocks,
  markdownProp,
  requireFeature,
  stringProp,
  supportsFeature,
} from "./render-shared.js";
import { codeFence, escapeInline, escapeLinkDestination, inlineCode } from "./escape.js";
import { adapterFromName } from "./adapters.js";
import { isElement } from "./runtime.js";
import { renderBlocks as renderBlocksWithApi } from "./render-blocks.js";
import { renderList } from "./render-list.js";
import { renderTable } from "./render-table.js";

type ElementRenderer = (
  element: MarkdownElement,
  context: RenderContext,
  mode: RenderMode,
) => string;

export const render = (node: MarkdownNode, options: RenderOptions = {}): string => {
  const adapter =
    typeof options.adapter === "string"
      ? adapterFromName(options.adapter)
      : (options.adapter ?? adapterFromName("markdown"));
  const output = renderBlock(node, {
    adapter,
    headingLevel: 1,
    unsupported: options.unsupported ?? "error",
  }).trimEnd();
  return output.length === 0 ? "" : `${output}\n`;
};

const renderBlock = (node: MarkdownNode, context: RenderContext): string =>
  renderNode(node, context, "block");

const renderInline = (node: MarkdownNode, context: RenderContext): string =>
  renderNode(node, context, "inline");

const renderNode = (node: MarkdownNode, context: RenderContext, mode: RenderMode): string => {
  if (isEmptyNode(node)) {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return escapeInline(String(node));
  }

  return renderCompositeNode(node, context, mode);
};

const renderCompositeNode = (
  node: MarkdownNode,
  context: RenderContext,
  mode: RenderMode,
): string => {
  if (isMarkdownNodeArray(node)) {
    return mode === "block"
      ? renderBlocks(node, context)
      : node.map((child) => renderInline(child, context)).join("");
  }

  if (!isElement(node)) {
    return "";
  }

  if (typeof node.type === "function") {
    return renderNode(node.type(node.props, toComponentContext(context)), context, mode);
  }

  return renderElement(node, context, mode);
};

const renderElement = (
  element: MarkdownElement,
  context: RenderContext,
  mode: RenderMode,
): string => {
  const { type } = element;
  if (typeof type !== "string") {
    return renderInline(element.props.children, context);
  }

  const renderer = elementRenderers[type] ?? (isHeadingType(type) ? renderFixedHeading : undefined);
  return renderer === undefined
    ? renderInline(element.props.children, context)
    : renderer(element, context, mode);
};

const renderRaw = (element: MarkdownElement, context: RenderContext): string => {
  const { children } = element.props;
  return typeof children === "string" ? children : rawText(children, context);
};

const renderContainer = (
  element: MarkdownElement,
  context: RenderContext,
  mode: RenderMode,
): string =>
  mode === "block"
    ? renderBlocks(childrenToArray(element.props.children), context)
    : renderInline(childrenToArray(element.props.children), context);

const renderSection = (element: MarkdownElement, context: RenderContext): string => {
  const title = markdownProp(element.props, "title");
  const titleOutput =
    title === undefined ? "" : renderHeading(title, context.headingLevel, context);
  const body = renderBlocks(childrenToArray(element.props.children), incrementHeading(context));
  return joinBlocks([titleOutput, body]);
};

const renderAutoHeading = (element: MarkdownElement, context: RenderContext): string => {
  const level = numericProp(element.props, "level") ?? context.headingLevel;
  return renderHeading(element.props.children, level, context);
};

const renderFixedHeading = (element: MarkdownElement, context: RenderContext): string =>
  renderHeading(element.props.children, headingLevelFromElement(element), context);

const renderParagraph = (element: MarkdownElement, context: RenderContext): string =>
  renderInline(element.props.children, context);

const renderStrong = (element: MarkdownElement, context: RenderContext): string =>
  `**${renderInline(element.props.children, context)}**`;

const renderEmphasis = (element: MarkdownElement, context: RenderContext): string =>
  `_${renderInline(element.props.children, context)}_`;

const renderDelete = (element: MarkdownElement, context: RenderContext): string => {
  if (supportsFeature(context, "gfm")) {
    return `~~${renderInline(element.props.children, context)}~~`;
  }

  if (context.unsupported === "error") {
    requireFeature(context, "gfm", "del");
  }

  return renderInline(element.props.children, context);
};

const renderBreak = (
  _element: MarkdownElement,
  _context: RenderContext,
  mode: RenderMode,
): string => (mode === "inline" ? "  \n" : "");

const renderRule = (): string => "---";

const renderBlockquote = (element: MarkdownElement, context: RenderContext): string =>
  renderBlocks(childrenToArray(element.props.children), context)
    .split("\n")
    .map((line) => (line.length === 0 ? ">" : `> ${line}`))
    .join("\n");

const renderUnorderedList = (element: MarkdownElement, context: RenderContext): string =>
  renderList({ api: renderApi, context, element, ordered: false });

const renderOrderedList = (element: MarkdownElement, context: RenderContext): string =>
  renderList({ api: renderApi, context, element, ordered: true });

const renderListItem = (element: MarkdownElement, context: RenderContext): string =>
  renderBlocks(childrenToArray(element.props.children), context);

const renderCode = (element: MarkdownElement, context: RenderContext): string =>
  inlineCode(rawText(element.props.children, context));

const renderPre = (element: MarkdownElement, context: RenderContext): string => {
  const language = stringProp(element.props, "lang") ?? stringProp(element.props, "language");
  return codeFence(rawText(element.props.children, context), language);
};

const renderLink = (element: MarkdownElement, context: RenderContext): string => {
  const href = escapeLinkDestination(stringProp(element.props, "href") ?? "");
  return `[${renderInline(element.props.children, context)}](${href}${titlePart(element)})`;
};

const renderImage = (element: MarkdownElement): string => {
  const alt = escapeInline(stringProp(element.props, "alt") ?? "");
  const source = escapeLinkDestination(stringProp(element.props, "src") ?? "");
  return `![${alt}](${source}${titlePart(element)})`;
};

const renderTableElement = (element: MarkdownElement, context: RenderContext): string =>
  renderTable(element, context, renderApi);

const titlePart = (element: MarkdownElement): string => {
  const title = stringProp(element.props, "title");
  return title === undefined ? "" : ` ${JSON.stringify(title)}`;
};

const renderHeading = (children: MarkdownNode, level: number, context: RenderContext): string => {
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new Error(`Heading level ${String(level)} is outside the h1-h6 range.`);
  }

  return `${"#".repeat(level)} ${renderInline(children, context)}`;
};

const resolveComponent = (node: MarkdownNode, context: RenderContext): MarkdownNode => {
  if (!isElement(node) || typeof node.type !== "function") {
    return node;
  }

  return node.type(node.props, toComponentContext(context));
};

const renderBlocks = (
  children: readonly MarkdownNode[] | MarkdownNode,
  context: RenderContext,
): string => renderBlocksWithApi(children, context, renderApi);

const rawText = (children: MarkdownNode, context: RenderContext): string =>
  childrenToArray(children)
    .map((child) => rawTextChild(child, context))
    .join("");

const rawTextChild = (child: MarkdownNode, context: RenderContext): string => {
  if (typeof child === "string" || typeof child === "number") {
    return String(child);
  }

  if (isElement(child) && child.type === "raw") {
    return rawText(child.props.children, context);
  }

  return renderNode(
    child,
    {
      adapter: adapterFromName("markdown"),
      headingLevel: 1,
      unsupported: context.unsupported,
    },
    "inline",
  );
};

const numericProp = (props: Readonly<Record<string, unknown>>, key: string): number | undefined => {
  const value = props[key];
  return typeof value === "number" ? value : undefined;
};

const headingLevelFromElement = (element: MarkdownElement): number =>
  typeof element.type === "string" ? Number(element.type.slice(1)) : 1;

const isEmptyNode = (node: MarkdownNode): boolean =>
  node === null || node === undefined || node === false || node === true;

const toComponentContext = (context: RenderContext): ComponentContext => ({
  adapter: context.adapter,
  headingLevel: context.headingLevel,
  renderBlock: (node): string => renderBlock(node, context),
  renderInline: (node): string => renderInline(node, context),
  requireAdapter: (feature, componentName): void => {
    requireFeature(context, feature, componentName);
  },
  unsupported: context.unsupported,
});

const elementRenderers: Readonly<Record<string, ElementRenderer>> = {
  // oxlint-disable id-length -- Renderer dispatch keys mirror Markdown and HTML tag names.
  a: renderLink,
  blockquote: renderBlockquote,
  br: renderBreak,
  code: renderCode,
  del: renderDelete,
  doc: renderContainer,
  em: renderEmphasis,
  fragment: renderContainer,
  "heading-auto": renderAutoHeading,
  hr: renderRule,
  img: renderImage,
  li: renderListItem,
  ol: renderOrderedList,
  p: renderParagraph,
  pre: renderPre,
  raw: renderRaw,
  section: renderSection,
  strong: renderStrong,
  table: renderTableElement,
  tbody: renderContainer,
  td: renderParagraph,
  th: renderParagraph,
  thead: renderContainer,
  tr: renderContainer,
  ul: renderUnorderedList,
  // oxlint-enable id-length
};

const renderApi = { renderBlock, renderBlocks, renderInline, resolveComponent };
