import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { render } from "jsx2md";
import * as core from "jsx2md";
import * as jsxRuntime from "jsx2md/jsx-runtime";
import * as github from "@jsx2md/github";
import { migrateMarkdown } from "@jsx2md/migrate";
import type { MarkdownNode, RenderOptions } from "jsx2md";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { unified } from "unified";

describe("migrateMarkdown", () => {
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
    return core;
  }

  if (source === "@jsx2md/github") {
    return github;
  }

  if (source === "jsx2md/jsx-runtime") {
    return jsxRuntime;
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

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "position" && key !== "spread")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, normalizeSyntaxTree(child)]),
  );
};
