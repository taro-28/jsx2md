import type {
  Code,
  Content,
  DefinitionContent,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  Table,
  Text,
  ThematicBreak,
} from "mdast";
import { toMarkdown } from "mdast-util-to-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export interface MigrateOptions {
  readonly adapter?: "markdown" | "gfm" | "github";
}

export interface MigrateResult {
  readonly code: string;
  readonly diagnostics: readonly string[];
}

interface State {
  readonly githubImports: Set<string>;
  readonly diagnostics: string[];
  readonly source: string;
}

export const migrateMarkdown = (source: string, options: MigrateOptions = {}): MigrateResult => {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as Root;
  const state: State = {
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
    imports.push(`import { ${[...state.githubImports].sort().join(", ")} } from "@jsx2md/github";`);
  }

  return {
    code: `${imports.join("\n")}\n\nexport default (\n  <Doc>\n${indent(body, 4)}\n  </Doc>\n);\n`,
    diagnostics: state.diagnostics,
  };
};

const blockToTsx = (node: Content, state: State, options: MigrateOptions): string => {
  if (node.type === "heading") {
    return headingToTsx(node, state);
  }

  if (node.type === "paragraph") {
    return paragraphToTsx(node, state);
  }

  if (node.type === "list") {
    return listToTsx(node, state, options);
  }

  if (node.type === "blockquote") {
    return wrap(
      "blockquote",
      node.children.map((child) => blockToTsx(child, state, options)).join("\n"),
    );
  }

  if (node.type === "code") {
    return codeToTsx(node);
  }

  if (node.type === "thematicBreak") {
    return thematicBreakToTsx(node);
  }

  if (node.type === "html") {
    return rawToTsx(node, state, "HTML block");
  }

  if (node.type === "table") {
    return tableToTsx(node, state);
  }

  if (node.type === "footnoteDefinition") {
    state.githubImports.add("Footnote");
    return `<Footnote id=${quoteAttribute(String(node.identifier))}>${node.children
      .map((child) => blockToTsx(child, state, options))
      .join("")}</Footnote>`;
  }

  return unknownToTsx(node, state);
};

const headingToTsx = (node: Heading, state: State): string =>
  wrap(`h${String(node.depth)}`, inlineNodesToTsx(node.children, state));

const paragraphToTsx = (node: Paragraph, state: State): string =>
  wrap("p", inlineNodesToTsx(node.children, state));

const listToTsx = (node: List, state: State, options: MigrateOptions): string => {
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

const listItemChildrenToTsx = (item: ListItem, state: State, options: MigrateOptions): string =>
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

const tableToTsx = (node: Table, state: State): string => {
  const [head, ...body] = node.children;
  const alignment = node.align ?? [];
  const header =
    head === undefined
      ? ""
      : rowToTsx({
          alignment,
          cellTag: "th",
          cells: head.children,
          state,
        });
  const rows = body
    .map((row) =>
      rowToTsx({
        alignment,
        cellTag: "td",
        cells: row.children,
        state,
      }),
    )
    .join("\n");
  return `<table>\n  <thead>\n${indent(header, 4)}\n  </thead>\n  <tbody>\n${indent(
    rows,
    4,
  )}\n  </tbody>\n</table>`;
};

interface RowToTsxOptions {
  readonly alignment: readonly (string | null | undefined)[];
  readonly cellTag: "td" | "th";
  readonly cells: readonly Table["children"][number]["children"][number][];
  readonly state: State;
}

const rowToTsx = ({ alignment, cellTag, cells, state }: RowToTsxOptions): string =>
  `<tr>\n${indent(
    cells
      .map((cell, index) =>
        wrap(
          `${cellTag}${alignAttribute(alignment[index])}`,
          inlineNodesToTsx(cell.children, state),
        ),
      )
      .join("\n"),
    2,
  )}\n</tr>`;

const alignAttribute = (value: string | null | undefined): string =>
  value === "left" || value === "center" || value === "right"
    ? ` align=${quoteAttribute(value)}`
    : "";

const inlineNodesToTsx = (nodes: readonly PhrasingContent[], state: State): string =>
  nodes.map((node) => inlineNodeToTsx(node, state)).join("");

const inlineNodeToTsx = (node: PhrasingContent, state: State): string => {
  if (node.type === "text") {
    return textToTsx(node);
  }

  if (node.type === "inlineCode") {
    return inlineCodeToTsx(node);
  }

  if (node.type === "emphasis") {
    return wrap("em", inlineNodesToTsx(node.children, state));
  }

  if (node.type === "strong") {
    return wrap("strong", inlineNodesToTsx(node.children, state));
  }

  if (node.type === "delete") {
    return wrap("del", inlineNodesToTsx(node.children, state));
  }

  if (node.type === "link") {
    return linkToTsx(node, state);
  }

  if (node.type === "image") {
    return imageToTsx(node);
  }

  if (node.type === "break") {
    return "<br />";
  }

  if (node.type === "html") {
    return rawToTsx(node, state, "inline HTML");
  }

  if (node.type === "footnoteReference") {
    state.githubImports.add("FootnoteRef");
    return `<FootnoteRef id=${quoteAttribute(String(node.identifier))} />`;
  }

  return unknownToTsx(node, state);
};

const textToTsx = (node: Text): string => `{${JSON.stringify(node.value)}}`;

const inlineCodeToTsx = (node: InlineCode): string =>
  `<code>{${JSON.stringify(node.value)}}</code>`;

const linkToTsx = (node: Link, state: State): string => {
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

const rawToTsx = (node: Html, state: State, label: string): string => {
  state.diagnostics.push(`Preserved ${label} as RawMarkdown.`);
  return `<RawMarkdown>{${JSON.stringify(rawSource(node, state))}}</RawMarkdown>`;
};

const unknownToTsx = (
  node: Content | PhrasingContent | DefinitionContent,
  state: State,
): string => {
  state.diagnostics.push(`Preserved unsupported ${node.type} node as RawMarkdown.`);
  return `<RawMarkdown>{${JSON.stringify(rawSource(node, state))}}</RawMarkdown>`;
};

const rawSource = (node: Content | PhrasingContent | DefinitionContent, state: State): string => {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (typeof start === "number" && typeof end === "number" && start >= 0 && end >= start) {
    return state.source.slice(start, end);
  }

  return toMarkdown(node);
};

const wrap = (tag: string, body: string): string =>
  body.length === 0 ? `<${tag} />` : `<${tag}>${body}</${tag}>`;

const quoteAttribute = (value: string): string => JSON.stringify(value);

const indent = (value: string, spaces: number): string => {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join("\n");
};
