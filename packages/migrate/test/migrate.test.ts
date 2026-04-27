import { Doc, type MarkdownNode, RawMarkdown, type RenderOptions, render } from "jsx2md";
import { Footnote, FootnoteRef, TaskItem, TaskList } from "@jsx2md/gfm";
import { Fragment, jsx, jsxs } from "jsx2md/jsx-runtime";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { describe, expect, it } from "vitest";
import { migrateMarkdown } from "@jsx2md/migrate";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { runInNewContext } from "node:vm";
import { unified } from "unified";

describe("Markdown migration", () => {
  it("converts CommonMark and GFM nodes to TSX", () => {
    const result = migrateMarkdown(
      [
        "# Title",
        "",
        "Hello **world** and [docs](https://example.com).",
        "",
        "- [x] Done",
        "- [ ] Later",
        "",
        "| Name | Score |",
        "| --- | ---: |",
        "| Ada | 10 |",
      ].join("\n"),
      { adapter: "github" },
    );

    expect(result.code).toContain("/** @jsxRuntime automatic */");
    expect(result.code).toContain("/** @jsxImportSource jsx2md */");
    expect(result.code).toContain('from "@jsx2md/gfm"');
    expect(result.code).toContain('<h1>{"Title"}</h1>');
    expect(result.code).toContain('<strong>{"world"}</strong>');
    expect(result.code).toContain("<TaskList>");
    expect(result.code).toContain('<TaskItem checked>{"Done"}</TaskItem>');
    expect(result.code).toContain("<table>");
    expect(result.diagnostics).toEqual([]);
  });

  it("preserves HTML as RawMarkdown with a diagnostic", () => {
    const result = migrateMarkdown("<div>custom</div>");

    expect(result.code).toContain("<RawMarkdown>");
    expect(result.diagnostics).toEqual(["Preserved HTML block as RawMarkdown."]);
  });

  it("can omit JSX pragma comments for projects with jsxImportSource in tsconfig", () => {
    const result = migrateMarkdown("# Title\n", { pragma: false });

    expect(result.code).not.toContain("@jsxRuntime");
    expect(result.code).not.toContain("@jsxImportSource");
    expect(result.code).toContain('import { Doc, RawMarkdown } from "jsx2md";');
  });
});

describe("migrateMarkdown semantic round trip", () => {
  it("round-trips migrated Markdown through rendered mdast semantics", () => {
    const source = [
      "# Title",
      "",
      "Hello **world** and [docs](https://example.com/docs).",
      "",
      "> Quoted",
      "",
      "- [x] Done",
      "  - Nested",
      "",
      "| Name | Score |",
      "| :--- | ---: |",
      "| Ada | 10 |",
      "",
      "```ts",
      "const value = `ok`;",
      "```",
      "",
      "Raw <span>HTML</span>.",
      "",
      "[^note]: Footnote text",
      "",
    ].join("\n");

    const result = migrateMarkdown(source, { adapter: "github" });
    const markdown = renderMigrated(result.code, { adapter: "github" });

    expect(result.diagnostics).toEqual([
      "Preserved inline HTML as RawMarkdown.",
      "Preserved inline HTML as RawMarkdown.",
    ]);
    expect(markdownTree(markdown)).toEqual(markdownTree(source));
  });
});

const coreModule = { Doc, RawMarkdown };
const gfmModule = { Footnote, FootnoteRef, TaskItem, TaskList };
const jsxRuntimeModule = { Fragment, jsx, jsxs };

const renderMigrated = (code: string, options: RenderOptions): string => {
  const transpiled = transpileModule(code, {
    compilerOptions: {
      jsx: JsxEmit.ReactJSX,
      jsxImportSource: "jsx2md",
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ES2022,
    },
  }).outputText;
  const commonJsModule: CommonJsModule = {
    exports: {},
  };
  runInNewContext(
    transpiled,
    {
      exports: commonJsModule.exports,
      module: commonJsModule,
      require: requireGeneratedModule,
    },
    {
      timeout: 1000,
    },
  );

  return render(commonJsModule.exports.default, options);
};

interface CommonJsModule {
  readonly exports: {
    default?: MarkdownNode;
  };
}

const requireGeneratedModule = (source: string): unknown => {
  if (source === "jsx2md") {
    return coreModule;
  }

  if (source === "@jsx2md/gfm") {
    return gfmModule;
  }

  if (source === "jsx2md/jsx-runtime") {
    return jsxRuntimeModule;
  }

  throw new Error(`Unexpected generated import: ${source}`);
};

const markdownTree = (source: string): unknown =>
  normalizeSyntaxTree(unified().use(remarkParse).use(remarkGfm).parse(source));

const normalizeSyntaxTree = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((child) => normalizeSyntaxTree(child));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Object.entries loses value precision for unknown syntax tree records.
  const record = value as Record<string, unknown>;
  const entries = Object.entries(record).filter(([key]) => key !== "position" && key !== "spread");
  entries.sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(
    entries.map(([key, child]): [string, unknown] => [key, normalizeSyntaxTree(child)]),
  );
};
