import {
  type AdapterFeature,
  type Component,
  type ComponentContext,
  type MarkdownChildren,
  type MarkdownNode,
  RawMarkdown,
  githubAdapter,
} from "jsx2md";

export { githubAdapter };

export type AlertVariant = "caution" | "important" | "note" | "tip" | "warning";

export interface AlertProps {
  readonly children?: MarkdownChildren;
  readonly title?: MarkdownChildren;
  readonly variant: AlertVariant;
}

export const Alert: Component<AlertProps> = (props, context) => {
  if (supports(context, "alert")) {
    return RawMarkdown({ children: githubAlert(props, context) }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("alert", "Alert");
  }

  return RawMarkdown({ children: fallbackAlert(props, context) }, context);
};

export interface FenceProps {
  readonly children: string;
}

export const Suggestion: Component<FenceProps> = ({ children }, context) => {
  if (supports(context, "suggestion")) {
    return RawMarkdown({ children: fenced("suggestion", children) }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("suggestion", "Suggestion");
  }

  return RawMarkdown(
    { children: context.unsupported === "plain" ? fenced("", children) : children },
    context,
  );
};

export const GeoJSON: Component<FenceProps> = ({ children }, context) =>
  renderGitHubFence({ componentName: "GeoJSON", context, language: "geojson", value: children });

export const TopoJSON: Component<FenceProps> = ({ children }, context) =>
  renderGitHubFence({ componentName: "TopoJSON", context, language: "topojson", value: children });

export const STL: Component<FenceProps> = ({ children }, context) =>
  renderGitHubFence({ componentName: "STL", context, language: "stl", value: children });

export interface MentionProps {
  readonly user: string;
}

export const Mention: Component<MentionProps> = ({ user }, context) =>
  githubText("Mention", `@${user}`, context);

interface ReferenceProps {
  readonly number: number;
  readonly owner?: string;
  readonly repo?: string;
}

export const IssueRef: Component<ReferenceProps> = (props, context) =>
  githubText("IssueRef", referenceText(props), context);

export const PullRef: Component<ReferenceProps> = (props, context) =>
  githubText("PullRef", referenceText(props), context);

export interface CommitRefProps {
  readonly repo?: string;
  readonly sha: string;
}

export const CommitRef: Component<CommitRefProps> = ({ repo, sha }, context) =>
  githubText("CommitRef", repo === undefined ? sha : `${repo}@${sha}`, context);

export interface ColorProps {
  readonly value: string;
}

export const Color: Component<ColorProps> = ({ value }, context) =>
  githubText("Color", `\`${value}\``, context);

export interface EmojiProps {
  readonly name: string;
}

export const Emoji: Component<EmojiProps> = ({ name }, context) =>
  githubText("Emoji", `:${name}:`, context);

const githubAlert = (
  { children, title, variant }: AlertProps,
  context: ComponentContext,
): string => {
  const label = variant.toUpperCase();
  const titleOutput = title === undefined ? "" : `\n> **${context.renderInline(title)}**`;
  const body = quoteBlock(context.renderBlock(children));
  return `> [!${label}]${titleOutput}${body.length === 0 ? "" : `\n${body}`}`;
};

const fallbackAlert = (
  { children, title, variant }: AlertProps,
  context: ComponentContext,
): string => {
  if (context.unsupported === "omit") {
    return context.renderBlock(children).trimEnd();
  }

  const label = variant.toUpperCase();
  const titleOutput = title === undefined ? "" : `\n> **${context.renderInline(title)}**`;
  const body = quoteBlock(context.renderBlock(children));
  return body.length === 0
    ? `> **${label}**${titleOutput}`
    : `> **${label}**${titleOutput}\n${body}`;
};

interface RenderGitHubFenceOptions {
  readonly componentName: string;
  readonly context: ComponentContext;
  readonly language: string;
  readonly value: string;
}

const renderGitHubFence = ({
  componentName,
  context,
  language,
  value,
}: RenderGitHubFenceOptions): MarkdownNode => {
  if (supports(context, "diagram")) {
    return RawMarkdown({ children: fenced(language, value) }, context);
  }

  if (context.unsupported === "error") {
    context.requireAdapter("diagram", componentName);
  }

  return RawMarkdown(
    { children: context.unsupported === "plain" ? fenced(language, value) : value },
    context,
  );
};

const githubText = (
  componentName: string,
  value: string,
  context: ComponentContext,
): MarkdownNode => {
  if (!supports(context, "github") && context.unsupported === "error") {
    context.requireAdapter("github", componentName);
  }

  return RawMarkdown({ children: value }, context);
};

const quoteBlock = (body: string): string =>
  body
    .trimEnd()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `> ${line}`)
    .join("\n");

const fenced = (language: string, value: string): string =>
  `\`\`\`${language}\n${value.replace(/\n$/, "")}\n\`\`\``;

const referenceText = ({ number, owner, repo }: ReferenceProps): string => {
  const prefix = owner === undefined || repo === undefined ? "" : `${owner}/${repo}`;
  return `${prefix}#${String(number)}`;
};

const supports = (context: ComponentContext, feature: AdapterFeature): boolean =>
  context.adapter.features.has(feature);
