/** @jsxImportSource jsx2md */
import { Doc, RawMarkdown, render } from "jsx2md";
import { describe, expect, it } from "vitest";

describe("CommonMark fixtures", () => {
  it("escapes inline text without changing raw markdown", () => {
    expect(
      render(
        <Doc>
          <p>{String.raw`*stars* _under_ [link] \ slash`}</p>
          <RawMarkdown>{"<!-- raw -->"}</RawMarkdown>
        </Doc>,
      ),
    ).toBe("\\*stars\\* \\_under\\_ \\[link\\] \\\\ slash\n\n<!-- raw -->\n");
  });

  it("renders nested lists with stable continuation indentation", () => {
    expect(
      render(
        <ul>
          <li>
            <p>Parent</p>
            <ul>
              <li>Child</li>
            </ul>
          </li>
          <li>Sibling</li>
        </ul>,
      ),
    ).toBe("- Parent\n\n  - Child\n- Sibling\n");
  });

  it("renders blockquotes containing other blocks", () => {
    expect(
      render(
        <blockquote>
          <p>Quoted</p>
          <ul>
            <li>Item</li>
          </ul>
        </blockquote>,
      ),
    ).toBe("> Quoted\n>\n> - Item\n");
  });
});

describe("GFM fixtures", () => {
  it("renders tables and escapes table cell separators", () => {
    expect(
      render(
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ada</td>
              <td>A|B</td>
            </tr>
          </tbody>
        </table>,
        { adapter: "gfm" },
      ),
    ).toBe("| Name | Note |\n| ---- | ---- |\n| Ada  | A\\|B |\n");
  });

  it("uses a larger code fence when code contains backticks", () => {
    expect(render(<pre lang="ts">{'const fence = "```";'}</pre>)).toBe(
      '````ts\nconst fence = "```";\n````\n',
    );
  });

  it("renders links and images with escaped destinations", () => {
    expect(
      render(
        <Doc>
          <p>
            <a href="https://example.com/docs page" title="Docs">
              docs
            </a>
          </p>
          <p>
            <img src="https://example.com/image (1).png" alt="logo [x]" />
          </p>
        </Doc>,
      ),
    ).toBe(
      '[docs](<https://example.com/docs page> "Docs")\n\n![logo \\[x\\]](<https://example.com/image (1).png>)\n',
    );
  });
});
