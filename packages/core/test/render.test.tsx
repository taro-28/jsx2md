/** @jsxImportSource jsx2md */
import { Doc, Heading, RawMarkdown, Section, render } from "jsx2md";
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
