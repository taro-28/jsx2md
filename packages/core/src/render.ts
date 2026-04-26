import { adapterFromName } from "./adapters.js";
import {
  codeFence,
  escapeInline,
  escapeLinkDestination,
  escapeTableCell,
  inlineCode,
} from "./escape.js";
import { isElement } from "./runtime.js";
import type {
  Adapter,
  AdapterFeature,
  ComponentContext,
  MarkdownElement,
  MarkdownNode,
  RenderOptions,
} from "./types.js";

interface RenderContext {
  readonly adapter: Adapter;
  readonly headingLevel: number;
}

type RenderMode = "block" | "inline";

export const render = (node: MarkdownNode, options: RenderOptions = {}): string => {
  const adapter =
    typeof options.adapter === "string"
      ? adapterFromName(options.adapter)
      : (options.adapter ?? adapterFromName("markdown"));
  const output = renderBlock(node, { adapter, headingLevel: 1 }).trimEnd();
  return output.length === 0 ? "" : `${output}\n`;
};

const renderBlock = (node: MarkdownNode, context: RenderContext): string =>
  renderNode(node, context, "block");

const renderInline = (node: MarkdownNode, context: RenderContext): string =>
  renderNode(node, context, "inline");

const renderNode = (node: MarkdownNode, context: RenderContext, mode: RenderMode): string => {
  if (node === null || node === undefined || node === false || node === true) {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return escapeInline(String(node));
  }

  if (Array.isArray(node)) {
    return mode === "block"
      ? renderBlocks(node, context)
      : node.map((child) => renderInline(child, context)).join("");
  }

  if (!isElement(node)) {
    return "";
  }

  if (typeof node.type === "function") {
    const nextNode = node.type(node.props, toComponentContext(context));
    return renderNode(nextNode, context, mode);
  }

  return renderElement(node, context, mode);
};

const renderElement = (
  element: MarkdownElement,
  context: RenderContext,
  mode: RenderMode,
): string => {
  const type = element.type;
  const props = element.props;
  const children = props.children;

  if (type === "raw") {
    return String(children ?? "");
  }

  if (type === "doc" || type === "fragment") {
    return mode === "block"
      ? renderBlocks(childrenToArray(children), context)
      : renderInline(childrenToArray(children), context);
  }

  if (type === "section") {
    const title = "title" in props ? props["title"] : undefined;
    const titleOutput =
      title === undefined
        ? ""
        : renderHeading(title as MarkdownNode, context.headingLevel, context);
    const sectionContext = incrementHeading(context);
    const body = renderBlocks(childrenToArray(children), sectionContext);
    return joinBlocks([titleOutput, body]);
  }

  if (type === "heading-auto") {
    const level =
      "level" in props && typeof props["level"] === "number"
        ? props["level"]
        : context.headingLevel;
    return renderHeading(children, level, context);
  }

  if (typeof type === "string" && isHeadingType(type)) {
    return renderHeading(children, Number(type.slice(1)), context);
  }

  if (type === "p") {
    return renderInline(children, context);
  }

  if (type === "strong") {
    return `**${renderInline(children, context)}**`;
  }

  if (type === "em") {
    return `_${renderInline(children, context)}_`;
  }

  if (type === "del") {
    requireFeature(context, "gfm", "del");
    return `~~${renderInline(children, context)}~~`;
  }

  if (type === "br") {
    return mode === "inline" ? "  \n" : "";
  }

  if (type === "hr") {
    return "---";
  }

  if (type === "blockquote") {
    const quote = renderBlocks(childrenToArray(children), context);
    return quote
      .split("\n")
      .map((line) => (line.length === 0 ? ">" : `> ${line}`))
      .join("\n");
  }

  if (type === "ul" || type === "ol") {
    return renderList(element, context, type === "ol");
  }

  if (type === "li") {
    return renderBlocks(childrenToArray(children), context);
  }

  if (type === "code") {
    const value = rawText(children);
    return inlineCode(value);
  }

  if (type === "pre") {
    const language = stringProp(props, "lang") ?? stringProp(props, "language");
    return codeFence(rawText(children), language);
  }

  if (type === "a") {
    const href = escapeLinkDestination(stringProp(props, "href") ?? "");
    const title = stringProp(props, "title");
    const titlePart = title === undefined ? "" : ` ${JSON.stringify(title)}`;
    return `[${renderInline(children, context)}](${href}${titlePart})`;
  }

  if (type === "img") {
    const source = escapeLinkDestination(stringProp(props, "src") ?? "");
    const alt = escapeInline(stringProp(props, "alt") ?? "");
    const title = stringProp(props, "title");
    const titlePart = title === undefined ? "" : ` ${JSON.stringify(title)}`;
    return `![${alt}](${source}${titlePart})`;
  }

  if (type === "table") {
    return renderTable(element, context);
  }

  if (type === "thead" || type === "tbody" || type === "tr") {
    return renderBlocks(childrenToArray(children), context);
  }

  if (type === "th" || type === "td") {
    return renderInline(children, context);
  }

  return renderInline(children, context);
};

const renderHeading = (children: MarkdownNode, level: number, context: RenderContext): string => {
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new Error(`Heading level ${String(level)} is outside the h1-h6 range.`);
  }

  return `${"#".repeat(level)} ${renderInline(children, context)}`;
};

const renderList = (element: MarkdownElement, context: RenderContext, ordered: boolean): string => {
  const start = ordered && typeof element.props["start"] === "number" ? element.props["start"] : 1;
  const items = childrenToArray(element.props.children)
    .map((child) => resolveComponent(child, context))
    .filter(isElement)
    .filter((child) => child.type === "li");

  return items
    .map((item, index) => {
      const checked =
        typeof item.props["checked"] === "boolean" ? item.props["checked"] : undefined;
      if (checked !== undefined) {
        requireFeature(context, "taskList", "li[checked]");
      }

      const prefix = ordered
        ? `${String(start + index)}. `
        : checked === undefined
          ? "- "
          : `- [${checked ? "x" : " "}] `;
      const body = renderBlocks(childrenToArray(item.props.children), context);
      const [firstLine = "", ...rest] = body.split("\n");
      const continuationIndent = " ".repeat(ordered ? prefix.length : 2);
      const indented = rest
        .map((line) => (line.length === 0 ? "" : `${continuationIndent}${line}`))
        .join("\n");
      return indented.length === 0 ? `${prefix}${firstLine}` : `${prefix}${firstLine}\n${indented}`;
    })
    .join("\n");
};

const renderTable = (element: MarkdownElement, context: RenderContext): string => {
  requireFeature(context, "table", "table");
  const rows = collectRows(element, context);
  if (rows.length === 0) {
    return "";
  }

  const [header, ...body] = rows;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedHeader = normalizeRow(header ?? [], columnCount);
  const bodyRows = body.map((row) => normalizeRow(row, columnCount));
  const escapedRows = [normalizedHeader, ...bodyRows].map((row) =>
    row.map((cell) => escapeTableCell(cell.value)),
  );
  const widths = columnWidths(escapedRows, normalizedHeader);
  const separator = normalizedHeader.map((cell, index) =>
    separatorFor(cell.align, widths[index] ?? 3),
  );
  const lines = [
    formatTableRow(escapedRows[0] ?? [], widths),
    formatTableRow(separator, widths),
    ...escapedRows.slice(1).map((row) => formatTableRow(row, widths)),
  ];
  return lines.join("\n");
};

interface TableCell {
  readonly align?: "left" | "center" | "right";
  readonly value: string;
}

const collectRows = (
  element: MarkdownElement,
  context: RenderContext,
): readonly (readonly TableCell[])[] => {
  const rows: TableCell[][] = [];
  const visit = (node: MarkdownNode): void => {
    const resolved = resolveComponent(node, context);
    if (Array.isArray(resolved)) {
      for (const child of resolved) {
        visit(child);
      }
      return;
    }

    if (!isElement(resolved)) {
      return;
    }

    if (resolved.type === "tr") {
      rows.push(
        childrenToArray(resolved.props.children)
          .map((child) => resolveComponent(child, context))
          .filter(isElement)
          .filter((cell) => cell.type === "th" || cell.type === "td")
          .map((cell) => {
            const align = cell.props["align"];
            return align === "left" || align === "center" || align === "right"
              ? {
                  align,
                  value: renderInline(cell.props.children, context),
                }
              : {
                  value: renderInline(cell.props.children, context),
                };
          }),
      );
      return;
    }

    visit(resolved.props.children);
  };

  visit(element.props.children);
  return rows;
};

const separatorFor = (align: TableCell["align"], width: number): string => {
  if (align === "left") {
    return `:${"-".repeat(Math.max(3, width - 1))}`;
  }

  if (align === "center") {
    return `:${"-".repeat(Math.max(3, width - 2))}:`;
  }

  if (align === "right") {
    return `${"-".repeat(Math.max(3, width - 1))}:`;
  }

  return "-".repeat(Math.max(3, width));
};

const normalizeRow = (row: readonly TableCell[], columnCount: number): readonly TableCell[] => {
  const next = [...row];
  while (next.length < columnCount) {
    next.push({ value: "" });
  }
  return next;
};

const columnWidths = (
  rows: readonly (readonly string[])[],
  header: readonly TableCell[],
): readonly number[] =>
  header.map((_cell, index) => Math.max(3, ...rows.map((row) => row[index]?.length ?? 0)));

const formatTableRow = (row: readonly string[], widths: readonly number[]): string =>
  `| ${widths.map((width, index) => padTableCell(row[index] ?? "", width)).join(" | ")} |`;

const padTableCell = (value: string, width: number): string =>
  value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;

const resolveComponent = (node: MarkdownNode, context: RenderContext): MarkdownNode => {
  if (!isElement(node) || typeof node.type !== "function") {
    return node;
  }

  return node.type(node.props, toComponentContext(context));
};

const renderBlocks = (
  children: readonly MarkdownNode[] | MarkdownNode,
  context: RenderContext,
): string => {
  const blocks: string[] = [];
  let inlineChildren: MarkdownNode[] = [];

  const flushInline = (): void => {
    if (inlineChildren.length === 0) {
      return;
    }

    blocks.push(inlineChildren.map((child) => renderInline(child, context)).join(""));
    inlineChildren = [];
  };

  const append = (node: MarkdownNode): void => {
    const resolved = resolveComponent(node, context);
    if (Array.isArray(resolved)) {
      for (const child of resolved) {
        append(child);
      }
      return;
    }

    if (isBlockNode(resolved)) {
      flushInline();
      blocks.push(renderBlock(resolved, context));
      return;
    }

    inlineChildren.push(resolved);
  };

  for (const child of childrenToArray(children)) {
    append(child);
  }

  flushInline();
  return joinBlocks(blocks);
};

const joinBlocks = (blocks: readonly string[]): string =>
  blocks
    .map((block) => block.trimEnd())
    .filter((block) => block.length > 0)
    .join("\n\n");

const childrenToArray = (children: MarkdownNode): MarkdownNode[] => {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap((child) => childrenToArray(child));
  }

  return [children];
};

const rawText = (children: MarkdownNode): string =>
  childrenToArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isElement(child) && child.type === "raw") {
        return rawText(child.props.children);
      }

      return renderNode(child, { adapter: adapterFromName("markdown"), headingLevel: 1 }, "inline");
    })
    .join("");

const stringProp = (props: Readonly<Record<string, unknown>>, key: string): string | undefined => {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
};

const incrementHeading = (context: RenderContext): RenderContext => ({
  ...context,
  headingLevel: context.headingLevel + 1,
});

const toComponentContext = (context: RenderContext): ComponentContext => ({
  adapter: context.adapter,
  headingLevel: context.headingLevel,
  renderBlock: (node): string => renderBlock(node, context),
  renderInline: (node): string => renderInline(node, context),
  requireAdapter: (feature, componentName): void => requireFeature(context, feature, componentName),
});

const requireFeature = (
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

const isHeadingType = (value: string): boolean => /^h[1-6]$/.test(value);

const isBlockNode = (node: MarkdownNode): boolean => {
  if (!isElement(node) || typeof node.type !== "string") {
    return false;
  }

  return blockElementTypes.has(node.type) || isHeadingType(node.type);
};

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
