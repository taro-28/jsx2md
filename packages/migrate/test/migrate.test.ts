import { describe, expect, it } from "vitest";
import { migrateMarkdown } from "@jsx2md/migrate";

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
});
