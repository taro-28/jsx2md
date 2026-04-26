import type {
  Code,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  RootContent,
  Text,
  ThematicBreak,
} from "mdast";
import { indent, quoteAttribute, rawToTsx, unknownToTsx, wrap } from "./format.js";
import type { MigrationState } from "./state.js";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { tableToTsx } from "./table.js";
import { unified } from "unified";

export interface MigrateOptions {
  readonly adapter?: "markdown" | "gfm" | "github";
}

export interface MigrateResult {
  readonly code: string;
  readonly diagnostics: readonly string[];
}

export const migrateMarkdown = (source: string, options: MigrateOptions = {}): MigrateResult => {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  const state: MigrationState = {
    diagnostics: [],
    githubImports: new Set(),
    source,
  };
  const body = tree.children.map((node) => blockToTsx(node, state, options)).join("\n");
  const imports = [
    "/** @jsxRuntime automatic */",
    "/** @jsxImportSource jsx2md */",
    'import { Doc, RawMarkdown } from "jsx2md";',
  ];

  if (state.githubImports.size > 0) {
    imports.push(
      `import { ${[...state.githubImports].toSorted().join(", ")} } from "@jsx2md/github";`,
    );
  }

  return {
    code: `${imports.join("\n")}\n\nexport default (\n  <Doc>\n${indent(body, 4)}\n  </Doc>\n);\n`,
    diagnostics: state.diagnostics,
  };
};

const blockToTsx = (node: RootContent, state: MigrationState, options: MigrateOptions): string =>
  simpleBlockToTsx(node, state) ??
  containerBlockToTsx(node, state, options) ??
  githubBlockToTsx(node, state, options) ??
  unknownToTsx(node, state);

const simpleBlockToTsx = (node: RootContent, state: MigrationState): string | undefined => {
  if (node.type === "heading") {
    return headingToTsx(node, state);
  }

  if (node.type === "paragraph") {
    return paragraphToTsx(node, state);
  }

  if (node.type === "code") {
    return codeToTsx(node);
  }

  if (node.type === "thematicBreak") {
    return thematicBreakToTsx(node);
  }

  return undefined;
};

const containerBlockToTsx = (
  node: RootContent,
  state: MigrationState,
  options: MigrateOptions,
): string | undefined => {
  if (node.type === "list") {
    return listToTsx(node, state, options);
  }

  if (node.type === "blockquote") {
    return wrap(
      "blockquote",
      node.children.map((child) => blockToTsx(child, state, options)).join("\n"),
    );
  }

  if (node.type === "table") {
    return tableToTsx({ api: tableApi, node, state });
  }

  return undefined;
};

const githubBlockToTsx = (
  node: RootContent,
  state: MigrationState,
  options: MigrateOptions,
): string | undefined => {
  if (node.type === "html") {
    return rawToTsx(node, state, "HTML block");
  }

  if (node.type === "footnoteDefinition") {
    state.githubImports.add("Footnote");
    return `<Footnote id=${quoteAttribute(node.identifier)}>${node.children
      .map((child) => blockToTsx(child, state, options))
      .join("")}</Footnote>`;
  }

  return undefined;
};

const headingToTsx = (node: Heading, state: MigrationState): string =>
  wrap(`h${String(node.depth)}`, inlineNodesToTsx(node.children, state));

const paragraphToTsx = (node: Paragraph, state: MigrationState): string =>
  wrap("p", inlineNodesToTsx(node.children, state));

const listToTsx = (node: List, state: MigrationState, options: MigrateOptions): string => {
  const hasTasks = node.children.some((item) => item.checked !== null);
  if (hasTasks && options.adapter === "github") {
    state.githubImports.add("TaskItem");
    state.githubImports.add("TaskList");
    return wrap(
      "TaskList",
      node.children
        .map((item) => {
          const checked = item.checked === true ? " checked" : "";
          return `<TaskItem${checked}>${listItemChildrenToTsx(item, state, options)}</TaskItem>`;
        })
        .join("\n"),
    );
  }

  const tag = node.ordered === true ? "ol" : "ul";
  const start =
    node.ordered === true && typeof node.start === "number" && node.start !== 1
      ? ` start={${String(node.start)}}`
      : "";
  return `<${tag}${start}>\n${indent(
    node.children
      .map((item) => `<li>${listItemChildrenToTsx(item, state, options)}</li>`)
      .join("\n"),
    2,
  )}\n</${tag}>`;
};

const listItemChildrenToTsx = (
  item: ListItem,
  state: MigrationState,
  options: MigrateOptions,
): string =>
  item.children
    .map((child) => {
      if (child.type === "paragraph") {
        return inlineNodesToTsx(child.children, state);
      }

      return blockToTsx(child, state, options);
    })
    .join("\n");

const codeToTsx = (node: Code): string => {
  const language =
    node.lang === null || node.lang === undefined ? "" : ` lang=${quoteAttribute(node.lang)}`;
  return `<pre${language}>{${JSON.stringify(node.value)}}</pre>`;
};

const thematicBreakToTsx = (_node: ThematicBreak): string => "<hr />";

const inlineNodesToTsx = (nodes: readonly PhrasingContent[], state: MigrationState): string =>
  nodes.map((node) => inlineNodeToTsx(node, state)).join("");

const inlineNodeToTsx = (node: PhrasingContent, state: MigrationState): string =>
  textInlineToTsx(node) ??
  phrasingInlineToTsx(node, state) ??
  resourceInlineToTsx(node, state) ??
  githubInlineToTsx(node, state) ??
  unknownToTsx(node, state);

const textInlineToTsx = (node: PhrasingContent): string | undefined => {
  if (node.type === "text") {
    return textToTsx(node);
  }

  if (node.type === "inlineCode") {
    return inlineCodeToTsx(node);
  }

  return undefined;
};

const phrasingInlineToTsx = (node: PhrasingContent, state: MigrationState): string | undefined => {
  if (node.type === "emphasis") {
    return wrap("em", inlineNodesToTsx(node.children, state));
  }

  if (node.type === "strong") {
    return wrap("strong", inlineNodesToTsx(node.children, state));
  }

  if (node.type === "delete") {
    return wrap("del", inlineNodesToTsx(node.children, state));
  }

  return undefined;
};

const resourceInlineToTsx = (node: PhrasingContent, state: MigrationState): string | undefined => {
  if (node.type === "link") {
    return linkToTsx(node, state);
  }

  if (node.type === "image") {
    return imageToTsx(node);
  }

  if (node.type === "break") {
    return "<br />";
  }

  return undefined;
};

const githubInlineToTsx = (node: PhrasingContent, state: MigrationState): string | undefined => {
  if (node.type === "html") {
    return rawToTsx(node, state, "inline HTML");
  }

  if (node.type === "footnoteReference") {
    state.githubImports.add("FootnoteRef");
    return `<FootnoteRef id=${quoteAttribute(node.identifier)} />`;
  }

  return undefined;
};

const textToTsx = (node: Text): string => `{${JSON.stringify(node.value)}}`;

const inlineCodeToTsx = (node: InlineCode): string =>
  `<code>{${JSON.stringify(node.value)}}</code>`;

const linkToTsx = (node: Link, state: MigrationState): string => {
  const title =
    node.title === null || node.title === undefined ? "" : ` title=${quoteAttribute(node.title)}`;
  return `<a href=${quoteAttribute(node.url)}${title}>${inlineNodesToTsx(
    node.children,
    state,
  )}</a>`;
};

const imageToTsx = (node: Image): string => {
  const title =
    node.title === null || node.title === undefined ? "" : ` title=${quoteAttribute(node.title)}`;
  return `<img src=${quoteAttribute(node.url)} alt=${quoteAttribute(node.alt ?? "")}${title} />`;
};

const tableApi = {
  inlineNodesToTsx,
};
