import type {
  AdmonitionProps,
  AnchorProps,
  AutoHeadingProps,
  CommonProps,
  Component,
  ComponentContext,
  DetailsProps,
  FenceProps,
  KbdProps,
  MarkdownElement,
  RawMarkdownProps,
  SectionProps,
} from "./types.js";
import { createElement } from "./runtime.js";
import { escapeHtml } from "./escape.js";

export const Doc: Component<CommonProps> = ({ children }) => createElement("doc", { children });

export const RawMarkdown: Component<RawMarkdownProps> = ({ children }) =>
  createElement("raw", { children });

export const Admonition: Component<AdmonitionProps> = (props, context) =>
  rawMarkdown(renderAdmonition(props, context));

export const Heading: Component<AutoHeadingProps> = ({ children, level }) =>
  createElement("heading-auto", { children, level });

export const Section: Component<SectionProps> = ({ children, title }) =>
  createElement("section", { children, title });

export const Details: Component<DetailsProps> = ({ children, open = false, summary }, context) => {
  if (!context.adapter.features.has("html")) {
    return rawMarkdown(renderUnsupportedDetails({ children, summary }, context));
  }

  const openAttribute = open ? " open" : "";
  const body = context.renderBlock(children).trimEnd();
  return rawMarkdown(
    `<details${openAttribute}>\n<summary>${context.renderInline(summary)}</summary>\n\n${body}\n</details>`,
  );
};

export const Diff: Component<FenceProps> = ({ children }) => rawMarkdown(fenced("diff", children));

export const Mermaid: Component<FenceProps> = ({ children }) =>
  rawMarkdown(fenced("mermaid", children));

export const Kbd: Component<KbdProps> = ({ children }, context) => {
  if (!context.adapter.features.has("html")) {
    return rawMarkdown(renderUnsupportedInline(children, context, "Kbd"));
  }

  return rawMarkdown(`<kbd>${escapeHtml(children)}</kbd>`);
};

export const Anchor: Component<AnchorProps> = ({ id }, context) => {
  if (!context.adapter.features.has("html")) {
    return rawMarkdown(renderUnsupportedInline("", context, "Anchor"));
  }

  return rawMarkdown(`<a id="${escapeHtml(id)}"></a>`);
};

const renderAdmonition = (
  { children, title, variant }: AdmonitionProps,
  context: ComponentContext,
): string => {
  const label = variant.toUpperCase();
  const titleOutput = title === undefined ? "" : `\n> **${context.renderInline(title)}**`;
  const body = quoteBlock(context.renderBlock(children));
  if (context.adapter.features.has("alert")) {
    return `> [!${label}]${titleOutput}${body.length === 0 ? "" : `\n${body}`}`;
  }

  const heading = `> **${label}**${titleOutput}`;
  return body.length === 0 ? heading : `${heading}\n${body}`;
};

const renderUnsupportedDetails = (
  { children, summary }: Pick<DetailsProps, "children" | "summary">,
  context: ComponentContext,
): string => {
  if (context.unsupported === "error") {
    context.requireAdapter("html", "Details");
  }

  const body = context.renderBlock(children).trimEnd();
  if (context.unsupported === "omit") {
    return body;
  }

  return body.length === 0
    ? `**${context.renderInline(summary)}**`
    : `**${context.renderInline(summary)}**\n\n${body}`;
};

const renderUnsupportedInline = (
  value: string,
  context: ComponentContext,
  componentName: string,
): string => {
  if (context.unsupported === "error") {
    context.requireAdapter("html", componentName);
  }

  return value;
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

const rawMarkdown = (value: string): MarkdownElement => createElement("raw", { children: value });
