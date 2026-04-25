/** @jsxImportSource jsx2md */
import { describe, expect, it } from "vitest";
import { Doc, render } from "jsx2md";
import {
  Alert,
  Details,
  Footnote,
  FootnoteRef,
  IssueRef,
  Kbd,
  Mermaid,
  Mention,
  Suggestion,
  TaskItem,
  TaskList,
} from "@jsx2md/github";

describe("GitHub components", () => {
  it("renders GitHub alerts", () => {
    expect(
      render(
        <Alert variant="warning" title="Careful">
          Check the generated output.
        </Alert>,
        { adapter: "github" },
      ),
    ).toBe("> [!WARNING]\n> **Careful**\n> Check the generated output.\n");
  });

  it("renders task lists, details, suggestions, and diagrams", () => {
    expect(
      render(
        <Doc>
          <TaskList>
            <TaskItem checked>Write tests</TaskItem>
            <TaskItem>Ship docs</TaskItem>
          </TaskList>
          <Details summary="Patch">
            <Suggestion>{"const ok = true;"}</Suggestion>
          </Details>
          <Mermaid>{"graph TD\nA-->B"}</Mermaid>
        </Doc>,
        { adapter: "github" },
      ),
    ).toContain("- [x] Write tests\n- [ ] Ship docs");
  });

  it("renders inline GitHub references", () => {
    expect(
      render(
        <p>
          <Mention user="octocat" /> reviewed <IssueRef number={123} /> with <Kbd>Cmd</Kbd>
          {"+"}
          <Kbd>K</Kbd> and a footnote <FootnoteRef id="a" />.<Footnote id="a">Details</Footnote>
        </p>,
        { adapter: "github" },
      ),
    ).toBe(
      "@octocat reviewed #123 with <kbd>Cmd</kbd>+<kbd>K</kbd> and a footnote [^a].[^a]: Details\n",
    );
  });

  it("rejects GitHub-only components with the markdown adapter", () => {
    expect(() => render(<Alert variant="note">Only GitHub supports this.</Alert>)).toThrow(
      "requires the alert feature",
    );
  });
});
