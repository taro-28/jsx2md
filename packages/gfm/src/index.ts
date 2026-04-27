import {
  type AdapterFeature,
  type Component,
  type ComponentContext,
  type MarkdownChildren,
  RawMarkdown,
  createElement,
  gfmAdapter,
} from "jsx2md";

export { gfmAdapter };

export interface TaskListProps {
  readonly children?: MarkdownChildren;
}

export const TaskList: Component<TaskListProps> = ({ children }, context) => {
  if (!supports(context, "taskList") && context.unsupported === "error") {
    context.requireAdapter("taskList", "TaskList");
  }

  return createElement("ul", { children });
};

export interface TaskItemProps {
  readonly checked?: boolean;
  readonly children?: MarkdownChildren;
}

export const TaskItem: Component<TaskItemProps> = ({ checked = false, children }, context) => {
  if (supports(context, "taskList")) {
    return createElement("li", { checked, children });
  }

  if (context.unsupported === "error") {
    context.requireAdapter("taskList", "TaskItem");
  }

  return createElement("li", { children });
};

export interface FootnoteProps {
  readonly children?: MarkdownChildren;
  readonly id: string;
}

export const Footnote: Component<FootnoteProps> = ({ children, id }, context) => {
  if (supports(context, "footnote")) {
    return RawMarkdown({ children: `[^${id}]: ${context.renderInline(children)}` }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("footnote", "Footnote");
  }

  return RawMarkdown({ children: renderPlainFootnote({ children, id }, context) }, context);
};

export interface FootnoteRefProps {
  readonly id: string;
}

export const FootnoteRef: Component<FootnoteRefProps> = ({ id }, context) => {
  if (supports(context, "footnote")) {
    return RawMarkdown({ children: `[^${id}]` }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("footnote", "FootnoteRef");
  }

  return RawMarkdown({ children: context.unsupported === "plain" ? `[${id}]` : "" }, context);
};

export interface StrikethroughProps {
  readonly children?: MarkdownChildren;
}

export const Strikethrough: Component<StrikethroughProps> = ({ children }, context) => {
  if (supports(context, "gfm")) {
    return RawMarkdown({ children: `~~${context.renderInline(children)}~~` }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("gfm", "Strikethrough");
  }

  return RawMarkdown({ children: context.renderInline(children) }, context);
};

const renderPlainFootnote = (
  { children, id }: FootnoteProps,
  context: ComponentContext,
): string => {
  const body = context.renderInline(children);
  if (context.unsupported === "omit") {
    return body;
  }

  return `[${id}]: ${body}`;
};

const supports = (context: ComponentContext, feature: AdapterFeature): boolean =>
  context.adapter.features.has(feature);
