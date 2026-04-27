/** @jsxImportSource jsx2md */
import { Doc, render } from "jsx2md";
import { Footnote, FootnoteRef, Strikethrough, TaskItem, TaskList } from "@jsx2md/gfm";
import { describe, expect, it } from "vitest";

describe("GFM task list components", () => {
  it("renders task lists with the GFM adapter", () => {
    expect(
      render(
        <TaskList>
          <TaskItem checked>Write tests</TaskItem>
          <TaskItem>Ship docs</TaskItem>
        </TaskList>,
        { adapter: "gfm" },
      ),
    ).toBe("- [x] Write tests\n- [ ] Ship docs\n");
  });

  it("renders footnotes and strikethrough with the GFM adapter", () => {
    expect(
      render(
        <Doc>
          <p>
            See <FootnoteRef id="a" /> and <Strikethrough>old text</Strikethrough>.
          </p>
          <Footnote id="a">Details</Footnote>
        </Doc>,
        { adapter: "gfm" },
      ),
    ).toBe("See [^a] and ~~old text~~.\n\n[^a]: Details\n");
  });

  it("rejects GFM components with the markdown adapter by default", () => {
    expect(() =>
      render(
        <TaskList>
          <TaskItem checked>Write tests</TaskItem>
        </TaskList>,
      ),
    ).toThrow("requires the taskList feature");
  });
});

describe("GFM fallback behavior", () => {
  it("can render GFM components as plain Markdown", () => {
    expect(
      render(
        <Doc>
          <TaskList>
            <TaskItem checked>Write tests</TaskItem>
          </TaskList>
          <p>
            See <FootnoteRef id="a" /> and <Strikethrough>old text</Strikethrough>.
          </p>
          <Footnote id="a">Details</Footnote>
        </Doc>,
        { unsupported: "plain" },
      ),
    ).toBe("- Write tests\n\nSee [a] and old text.\n\n[a]: Details\n");
  });

  it("can omit unsupported GFM markers while preserving children", () => {
    expect(
      render(
        <Doc>
          <TaskList>
            <TaskItem checked>Write tests</TaskItem>
          </TaskList>
          <p>
            See <FootnoteRef id="a" /> and <Strikethrough>old text</Strikethrough>.
          </p>
          <Footnote id="a">Details</Footnote>
        </Doc>,
        { unsupported: "omit" },
      ),
    ).toBe("- Write tests\n\nSee  and old text.\n\nDetails\n");
  });
});
