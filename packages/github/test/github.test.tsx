/** @jsxImportSource jsx2md */
import {
  Alert,
  Color,
  CommitRef,
  Emoji,
  GeoJSON,
  IssueRef,
  Mention,
  PullRef,
  Suggestion,
} from "@jsx2md/github";
import { Doc, render } from "jsx2md";
import { describe, expect, it } from "vitest";

describe("GitHub block components", () => {
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

  it("renders suggestions", () => {
    expect(render(<Suggestion>{"const ok = true;"}</Suggestion>, { adapter: "github" })).toBe(
      "```suggestion\nconst ok = true;\n```\n",
    );
  });
});

describe("GitHub diagram components", () => {
  it("renders GitHub-specific diagrams", () => {
    expect(
      render(<GeoJSON>{'{"type":"FeatureCollection","features":[]}'}</GeoJSON>, {
        adapter: "github",
      }),
    ).toBe('```geojson\n{"type":"FeatureCollection","features":[]}\n```\n');
  });
});

describe("GitHub inline components", () => {
  it("renders inline GitHub references", () => {
    expect(
      render(
        <p>
          <Mention user="octocat" /> reviewed <IssueRef number={123} />,{" "}
          <PullRef owner="octo" repo="repo" number={5} />,{" "}
          <CommitRef repo="octo/repo" sha="abc1234" />, <Color value="#0969da" />, and{" "}
          <Emoji name="shipit" />.
        </p>,
        { adapter: "github" },
      ),
    ).toBe("@octocat reviewed #123, octo/repo#5, octo/repo@abc1234, `#0969da`, and :shipit:.\n");
  });
});

describe("GitHub fallback behavior", () => {
  it("rejects GitHub-only components with the markdown adapter by default", () => {
    expect(() => render(<Alert variant="note">Only GitHub supports this.</Alert>)).toThrow(
      "requires the alert feature",
    );
  });

  it("can render GitHub-only components as plain Markdown", () => {
    expect(
      render(
        <Doc>
          <Alert variant="note">Only GitHub supports this.</Alert>
          <Suggestion>{"const ok = true;"}</Suggestion>
          <p>
            <Mention user="octocat" /> reviewed <IssueRef number={123} />.
          </p>
        </Doc>,
        { unsupported: "plain" },
      ),
    ).toBe(
      "> **NOTE**\n> Only GitHub supports this.\n\n```\nconst ok = true;\n```\n\n@octocat reviewed #123.\n",
    );
  });

  it("can omit GitHub-only wrappers while preserving children", () => {
    expect(
      render(
        <Doc>
          <Alert variant="note">Only GitHub supports this.</Alert>
          <Suggestion>{"const ok = true;"}</Suggestion>
        </Doc>,
        { unsupported: "omit" },
      ),
    ).toBe("Only GitHub supports this.\n\nconst ok = true;\n");
  });
});

describe("GitHub diagram fallback behavior", () => {
  it("rejects GitHub-specific diagrams with the GFM adapter by default", () => {
    expect(() =>
      render(<GeoJSON>{'{"type":"FeatureCollection","features":[]}'}</GeoJSON>, {
        adapter: "gfm",
      }),
    ).toThrow("requires the diagram feature");
  });

  it("can render GitHub-specific diagrams as code fences", () => {
    expect(
      render(<GeoJSON>{'{"type":"FeatureCollection","features":[]}'}</GeoJSON>, {
        adapter: "gfm",
        unsupported: "plain",
      }),
    ).toBe('```geojson\n{"type":"FeatureCollection","features":[]}\n```\n');
  });
});
