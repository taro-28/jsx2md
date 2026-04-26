import type { MarkdownElement, MarkdownNode } from "./types.js";
import { type RenderContext, childrenToArray, requireFeature } from "./render-shared.js";
import { isElement } from "./runtime.js";

interface ListRenderApi {
  readonly renderBlocks: (
    children: readonly MarkdownNode[] | MarkdownNode,
    context: RenderContext,
  ) => string;
  readonly resolveComponent: (node: MarkdownNode, context: RenderContext) => MarkdownNode;
}

interface RenderListOptions {
  readonly api: ListRenderApi;
  readonly context: RenderContext;
  readonly element: MarkdownElement;
  readonly ordered: boolean;
}

interface RenderListItemOptions {
  readonly api: ListRenderApi;
  readonly context: RenderContext;
  readonly ordered: boolean;
  readonly start: number;
}

interface ListPrefixOptions {
  readonly checked: boolean | undefined;
  readonly index: number;
  readonly ordered: boolean;
  readonly start: number;
}

interface FormatListItemOptions {
  readonly firstLine: string;
  readonly ordered: boolean;
  readonly prefix: string;
  readonly rest: readonly string[];
}

export const renderList = ({ api, context, element, ordered }: RenderListOptions): string => {
  const start = ordered && typeof element.props["start"] === "number" ? element.props["start"] : 1;
  const options: RenderListItemOptions = {
    api,
    context,
    ordered,
    start,
  };
  return collectListItems(element, context, api)
    .map((item, index) => renderListItem(item, index, options))
    .join("\n");
};

const collectListItems = (
  element: MarkdownElement,
  context: RenderContext,
  api: ListRenderApi,
): readonly MarkdownElement[] =>
  childrenToArray(element.props.children)
    .map((child) => api.resolveComponent(child, context))
    .filter((child) => isElement(child))
    .filter((child) => child.type === "li");

const renderListItem = (
  item: MarkdownElement,
  index: number,
  options: RenderListItemOptions,
): string => {
  const checked = typeof item.props["checked"] === "boolean" ? item.props["checked"] : undefined;
  requireTaskListFeature(checked, options.context);

  const prefix = listPrefix({ checked, index, ordered: options.ordered, start: options.start });
  const body = options.api.renderBlocks(childrenToArray(item.props.children), options.context);
  const [firstLine = "", ...rest] = body.split("\n");
  return formatListItem({ firstLine, ordered: options.ordered, prefix, rest });
};

const requireTaskListFeature = (checked: boolean | undefined, context: RenderContext): void => {
  if (checked !== undefined) {
    requireFeature(context, "taskList", "li[checked]");
  }
};

const listPrefix = ({ checked, index, ordered, start }: ListPrefixOptions): string => {
  if (ordered) {
    return `${String(start + index)}. `;
  }

  if (checked === undefined) {
    return "- ";
  }

  return `- [${checked ? "x" : " "}] `;
};

const formatListItem = ({ firstLine, ordered, prefix, rest }: FormatListItemOptions): string => {
  const indented = indentContinuation(rest, ordered ? prefix.length : 2);
  return indented.length === 0 ? `${prefix}${firstLine}` : `${prefix}${firstLine}\n${indented}`;
};

const indentContinuation = (lines: readonly string[], spaces: number): string => {
  const continuationIndent = " ".repeat(spaces);
  return lines.map((line) => (line.length === 0 ? "" : `${continuationIndent}${line}`)).join("\n");
};
