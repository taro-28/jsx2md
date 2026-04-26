import {
  type Component,
  type ComponentContext,
  type MarkdownChildren,
  type MarkdownNode,
  RawMarkdown,
  createElement,
  escapeHtml,
  gfmAdapter,
  githubAdapter,
} from "jsx2md";

export { gfmAdapter, githubAdapter };

export type AlertVariant = "note" | "tip" | "important" | "warning" | "caution";

export interface AlertProps {
  readonly children?: MarkdownChildren;
  readonly title?: MarkdownChildren;
  readonly variant: AlertVariant;
}

export const Alert: Component<AlertProps> = ({ children, title, variant }, context) => {
  context.requireAdapter("alert", "Alert");
  const label = variant.toUpperCase();
  const titleOutput = title === undefined ? "" : `\n> **${context.renderInline(title)}**`;
  const body = quoteForAlert(context.renderBlock(children));
  return RawMarkdown(
    {
      children: `> [!${label}]${titleOutput}${body.length === 0 ? "" : `\n${body}`}`,
    },
    context,
  );
};

export interface TaskListProps {
  readonly children?: MarkdownChildren;
}

export const TaskList: Component<TaskListProps> = ({ children }, context) => {
  context.requireAdapter("taskList", "TaskList");
  return createElement("ul", { children });
};

export interface TaskItemProps {
  readonly checked?: boolean;
  readonly children?: MarkdownChildren;
}

export const TaskItem: Component<TaskItemProps> = ({ checked = false, children }) =>
  createElement("li", { checked, children });

export interface DetailsProps {
  readonly children?: MarkdownChildren;
  readonly open?: boolean;
  readonly summary: MarkdownChildren;
}

export const Details: Component<DetailsProps> = ({ children, open = false, summary }, context) => {
  context.requireAdapter("details", "Details");
  const openAttribute = open ? " open" : "";
  const body = context.renderBlock(children).trimEnd();
  return RawMarkdown(
    {
      children: `<details${openAttribute}>\n<summary>${context.renderInline(
        summary,
      )}</summary>\n\n${body}\n</details>`,
    },
    context,
  );
};

export interface FenceProps {
  readonly children: string;
}

export const Suggestion: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("suggestion", "Suggestion");
  return RawMarkdown({ children: fenced("suggestion", children) }, context);
};

export const Diff: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("github", "Diff");
  return RawMarkdown({ children: fenced("diff", children) }, context);
};

export const Mermaid: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("diagram", "Mermaid");
  return RawMarkdown({ children: fenced("mermaid", children) }, context);
};

export const GeoJSON: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("diagram", "GeoJSON");
  return RawMarkdown({ children: fenced("geojson", children) }, context);
};

export const TopoJSON: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("diagram", "TopoJSON");
  return RawMarkdown({ children: fenced("topojson", children) }, context);
};

export const STL: Component<FenceProps> = ({ children }, context) => {
  context.requireAdapter("diagram", "STL");
  return RawMarkdown({ children: fenced("stl", children) }, context);
};

export interface MentionProps {
  readonly user: string;
}

export const Mention: Component<MentionProps> = ({ user }, context) => {
  context.requireAdapter("github", "Mention");
  return RawMarkdown({ children: `@${user}` }, context);
};

interface ReferenceProps {
  readonly number: number;
  readonly owner?: string;
  readonly repo?: string;
}

export const IssueRef: Component<ReferenceProps> = (props, context) =>
  reference("IssueRef", props, context);

export const PullRef: Component<ReferenceProps> = (props, context) =>
  reference("PullRef", props, context);

export interface CommitRefProps {
  readonly repo?: string;
  readonly sha: string;
}

export const CommitRef: Component<CommitRefProps> = ({ repo, sha }, context) => {
  context.requireAdapter("github", "CommitRef");
  return RawMarkdown({ children: repo === undefined ? sha : `${repo}@${sha}` }, context);
};

export interface FootnoteProps {
  readonly children?: MarkdownChildren;
  readonly id: string;
}

export const Footnote: Component<FootnoteProps> = ({ children, id }, context) => {
  context.requireAdapter("footnote", "Footnote");
  return RawMarkdown(
    {
      children: `[^${id}]: ${context.renderInline(children)}`,
    },
    context,
  );
};

export interface FootnoteRefProps {
  readonly id: string;
}

export const FootnoteRef: Component<FootnoteRefProps> = ({ id }, context) => {
  context.requireAdapter("footnote", "FootnoteRef");
  return RawMarkdown({ children: `[^${id}]` }, context);
};

export interface ColorProps {
  readonly value: string;
}

export const Color: Component<ColorProps> = ({ value }, context) => {
  context.requireAdapter("github", "Color");
  return RawMarkdown({ children: `\`${value}\`` }, context);
};

export interface EmojiProps {
  readonly name: string;
}

export const Emoji: Component<EmojiProps> = ({ name }, context) => {
  context.requireAdapter("github", "Emoji");
  return RawMarkdown({ children: `:${name}:` }, context);
};

export interface KbdProps {
  readonly children: string;
}

export const Kbd: Component<KbdProps> = ({ children }, context) => {
  context.requireAdapter("html", "Kbd");
  return RawMarkdown({ children: `<kbd>${escapeHtml(children)}</kbd>` }, context);
};

export interface AnchorProps {
  readonly id: string;
}

export const Anchor: Component<AnchorProps> = ({ id }, context) => {
  context.requireAdapter("html", "Anchor");
  return RawMarkdown({ children: `<a id="${escapeHtml(id)}"></a>` }, context);
};

export interface StrikethroughProps {
  readonly children?: MarkdownChildren;
}

export const Strikethrough: Component<StrikethroughProps> = ({ children }, context) => {
  context.requireAdapter("gfm", "Strikethrough");
  return RawMarkdown({ children: `~~${context.renderInline(children)}~~` }, context);
};

const quoteForAlert = (body: string): string =>
  body
    .trimEnd()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `> ${line}`)
    .join("\n");

const fenced = (language: string, value: string): string =>
  `\`\`\`${language}\n${value.replace(/\n$/, "")}\n\`\`\``;

const reference = (
  componentName: string,
  { number, owner, repo }: ReferenceProps,
  context: ComponentContext,
): MarkdownNode => {
  context.requireAdapter("github", componentName);
  const prefix = owner === undefined || repo === undefined ? "" : `${owner}/${repo}`;
  return RawMarkdown({ children: `${prefix}#${String(number)}` }, context);
};
