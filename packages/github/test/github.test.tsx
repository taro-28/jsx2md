/** @jsxImportSource jsx2md */
import { describe, expect, it } from "vitest";
import { Doc, render } from "jsx2md";
import {
  Anchor,
  Alert,
  Color,
  CommitRef,
  Details,
  Emoji,
  Footnote,
  FootnoteRef,
  IssueRef,
  Kbd,
  Mermaid,
  Mention,
  PullRef,
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

  it("renders task lists", () => {
    expect(
      render(
        <TaskList>
          <TaskItem checked>Write tests</TaskItem>
          <TaskItem>Ship docs</TaskItem>
        </TaskList>,
        { adapter: "github" },
      ),
    ).toBe("- [x] Write tests\n- [ ] Ship docs\n");
  });

  it("renders details blocks and suggestions", () => {
    expect(
      render(
        <Details open summary="Patch">
          <Suggestion>{"const ok = true;"}</Suggestion>
        </Details>,
        { adapter: "github" },
      ),
    ).toBe(
      [
        "<details open>",
        "<summary>Patch</summary>",
        "",
        "```suggestion",
        "const ok = true;",
        "```",
        "</details>",
        "",
      ].join("\n"),
    );
  });

  it("renders diagrams", () => {
    expect(render(<Mermaid>{"graph TD\nA-->B"}</Mermaid>, { adapter: "github" })).toBe(
      "```mermaid\ngraph TD\nA-->B\n```\n",
    );
  });

  it("renders inline GitHub references", () => {
    expect(
      render(
        <p>
          <Mention user="octocat" /> reviewed <IssueRef number={123} /> with <Kbd>Cmd</Kbd>
          {"+"}
          <Kbd>K</Kbd>, <PullRef owner="octo" repo="repo" number={5} />,{" "}
          <CommitRef repo="octo/repo" sha="abc1234" />, <Color value="#0969da" />,{" "}
          <Emoji name="shipit" />, <Anchor id="release-notes" />, and a footnote{" "}
          <FootnoteRef id="a" />.
        </p>,
        { adapter: "github" },
      ),
    ).toBe(
      '@octocat reviewed #123 with <kbd>Cmd</kbd>+<kbd>K</kbd>, octo/repo#5, octo/repo@abc1234, `#0969da`, :shipit:, <a id="release-notes"></a>, and a footnote [^a].\n',
    );
  });

  it("renders footnote definitions", () => {
    expect(
      render(
        <Doc>
          <p>
            See note <FootnoteRef id="a" />.
          </p>
          <Footnote id="a">Details</Footnote>
        </Doc>,
        { adapter: "github" },
      ),
    ).toBe("See note [^a].\n\n[^a]: Details\n");
  });

  it("rejects GitHub-only components with the markdown adapter", () => {
    expect(() => render(<Alert variant="note">Only GitHub supports this.</Alert>)).toThrow(
      "requires the alert feature",
    );
  });
});
