/** @jsxImportSource jsx2md */
import {
  Admonition,
  Anchor,
  Details,
  Diff,
  Doc,
  Heading,
  Kbd,
  Mermaid,
  RawMarkdown,
  Section,
  render,
} from "jsx2md";
import { describe, expect, it } from "vitest";

describe("renderer basics", () => {
  it("renders headings, paragraphs, and conditional children", () => {
    const renderConditional = (includeDetails: boolean): string =>
      render(
        <Doc>
          <h1>Release notes</h1>
          <p>Hello [world]</p>
          {includeDetails ? <p>Included</p> : false}
          {false}
        </Doc>,
      );

    expect(renderConditional(true)).toBe("# Release notes\n\nHello \\[world\\]\n\nIncluded\n");
  });

  it("renders lists and task list items with the GFM adapter", () => {
    expect(
      render(
        <ul>
          <li>Done</li>
          <li checked>Checked</li>
        </ul>,
        { adapter: "gfm" },
      ),
    ).toBe("- Done\n- [x] Checked\n");
  });

  it("rejects unsupported GFM syntax by default", () => {
    expect(() =>
      render(
        <ul>
          <li checked>Checked</li>
        </ul>,
      ),
    ).toThrow("requires the taskList feature");
  });

  it("can render unsupported GFM syntax as plain Markdown", () => {
    expect(
      render(
        <ul>
          <li checked>Checked</li>
        </ul>,
        { unsupported: "plain" },
      ),
    ).toBe("- Checked\n");
  });
});

describe("renderer block formats", () => {
  it("renders tables", () => {
    expect(
      render(
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th align="right">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ada</td>
              <td>10</td>
            </tr>
          </tbody>
        </table>,
        { adapter: "gfm" },
      ),
    ).toBe("| Name | Score |\n| ---- | ----: |\n| Ada  | 10    |\n");
  });

  it("renders code fences and raw markdown", () => {
    expect(
      render(
        <Doc>
          <pre lang="ts">{"const value = `ok`;"}</pre>
          <RawMarkdown>{"<!-- generated -->"}</RawMarkdown>
        </Doc>,
      ),
    ).toBe("```ts\nconst value = `ok`;\n```\n\n<!-- generated -->\n");
  });
});

describe("portable admonition component", () => {
  it("renders admonitions as GitHub alerts for the GitHub adapter", () => {
    expect(
      render(
        <Admonition variant="note" title="Heads up">
          Read this.
        </Admonition>,
        { adapter: "github" },
      ),
    ).toBe("> [!NOTE]\n> **Heads up**\n> Read this.\n");
  });

  it("renders admonitions as readable blockquotes for portable Markdown", () => {
    expect(
      render(
        <Admonition variant="tip" title="Hint">
          Use the API.
        </Admonition>,
      ),
    ).toBe("> **TIP**\n> **Hint**\n> Use the API.\n");
  });
});

describe("portable HTML and fence components", () => {
  it("renders HTML-backed helpers with the markdown adapter", () => {
    expect(
      render(
        <p>
          Press <Kbd>Cmd</Kbd>
          {"+"}
          <Kbd>K</Kbd>
          <Anchor id="shortcuts" />.
        </p>,
      ),
    ).toBe('Press <kbd>Cmd</kbd>+<kbd>K</kbd><a id="shortcuts"></a>.\n');
  });

  it("renders details blocks and portable code fences", () => {
    expect(
      render(
        <Doc>
          <Details summary="More">
            <p>Body</p>
          </Details>
          <Diff>{"- old\n+ new"}</Diff>
          <Mermaid>{"graph TD\nA-->B"}</Mermaid>
        </Doc>,
      ),
    ).toBe(
      [
        "<details>",
        "<summary>More</summary>",
        "",
        "Body",
        "</details>",
        "",
        "```diff",
        "- old",
        "+ new",
        "```",
        "",
        "```mermaid",
        "graph TD",
        "A-->B",
        "```",
        "",
      ].join("\n"),
    );
  });
});

describe("automatic headings", () => {
  it("automatically adjusts heading levels", () => {
    expect(
      render(
        <Section title="Root">
          <p>Text</p>
          <Section title="Child">
            <Heading>Leaf</Heading>
          </Section>
        </Section>,
      ),
    ).toBe("# Root\n\nText\n\n## Child\n\n### Leaf\n");
  });

  it("throws when automatic heading levels exceed h6", () => {
    expect(() =>
      render(
        <Section title="1">
          <Section title="2">
            <Section title="3">
              <Section title="4">
                <Section title="5">
                  <Section title="6">
                    <Heading>7</Heading>
                  </Section>
                </Section>
              </Section>
            </Section>
          </Section>
        </Section>,
      ),
    ).toThrow("h1-h6");
  });
});
