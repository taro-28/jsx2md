/** @jsxRuntime automatic */
/** @jsxImportSource jsx2md */
import { Admonition, Doc, type MarkdownNode, RawMarkdown, Section } from "jsx2md";

const shell = (value: string): MarkdownNode => <pre lang="sh">{value}</pre>;
const json = (value: string): MarkdownNode => <pre lang="json">{value}</pre>;
const tsx = (value: string): MarkdownNode => <pre lang="tsx">{value}</pre>;

const packages = [
  ["jsx2md", "Core renderer, JSX runtime, CommonMark components, and adapters."],
  ["@jsx2md/gfm", "GitHub Flavored Markdown components."],
  ["@jsx2md/github", "GitHub-specific components."],
  ["@jsx2md/migrate", "Markdown to TSX migration utilities."],
  ["@jsx2md/cli", "The `jsx2md` command for render, check, and migrate workflows."],
];

// oxlint-disable-next-line import/no-default-export -- TSX entries are loaded by the CLI through their default export.
export default (
  <Doc>
    <Section title="jsx2md">
      <p>
        <code>jsx2md</code> generates Markdown from JSX and TSX without React. It is designed for
        typed README generation, GitHub pull request comments, and migration from hand-written
        Markdown to maintainable TSX documents.
      </p>
      <Admonition variant="note">
        Version <code>0.0.1</code> is an initial implementation. The repository is not configured
        for automatic publishing.
      </Admonition>
      <Section title="Install">
        <p>This repository uses pnpm workspaces.</p>
        {shell("pnpm install\npnpm build")}
      </Section>
      <Section title="JSX Runtime Setup">
        <p>
          Most projects should configure the JSX runtime once in <code>tsconfig.json</code>.
          Per-file pragma comments are useful for standalone TSX entries and generated migration
          output, but they are not required when the project config already points JSX at{" "}
          <code>jsx2md</code>.
        </p>
        {json(`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "jsx2md"
  }
}`)}
        {tsx(`/** @jsxImportSource jsx2md */
import { Doc } from "jsx2md";

export default (
  <Doc>
    <h1>Standalone entry</h1>
  </Doc>
);`)}
      </Section>
      <Section title="Programmatic API">
        {tsx(`import { Doc, render } from "jsx2md";

const markdown = render(
  <Doc>
    <h1>Release notes</h1>
    <p>Generated from typed TSX.</p>
  </Doc>,
);`)}
      </Section>
      <Section title="CLI">
        {shell(`jsx2md render docs/readme.tsx -o README.md --adapter github
jsx2md render docs/readme.tsx --adapter github
jsx2md render docs/readme.tsx --adapter markdown --unsupported plain
jsx2md check docs/readme.tsx -o README.md --adapter github
jsx2md migrate README.md -o docs/readme.tsx --adapter github
jsx2md migrate README.md -o docs/readme.tsx --adapter github --no-pragma`)}
        <p>Exit codes:</p>
        <ul>
          <li>
            <code>render</code>: <code>0</code> when Markdown is generated, <code>1</code> on load
            or render errors.
          </li>
          <li>
            <code>check</code>: <code>0</code> when output matches, <code>1</code> when output
            differs or an error occurs. Mismatches print a unified diff.
          </li>
          <li>
            <code>migrate</code>: <code>0</code> when TSX is generated, <code>1</code> on read,
            parse, or write errors. Preservation diagnostics are printed to stderr. Generated TSX
            includes JSX pragma comments by default; pass <code>--no-pragma</code> when your project
            already configures <code>jsxImportSource</code>.
          </li>
        </ul>
      </Section>
      <Section title="Adapters">
        <ul>
          <li>
            <code>markdown</code>: CommonMark-oriented Markdown with raw HTML support.
          </li>
          <li>
            <code>gfm</code>: GitHub Flavored Markdown features such as tables, task lists,
            strikethrough, and footnotes.
          </li>
          <li>
            <code>github</code>: GitHub.com syntax for repositories, issues, pull requests, and
            comments.
          </li>
        </ul>
        <p>
          Unsupported syntax throws by default. Pass <code>unsupported: "plain"</code> or{" "}
          <code>unsupported: "omit"</code> only when fallback output is intentional.
        </p>
      </Section>
      <Section title="Generated README">
        <p>
          This <code>README.md</code> is generated from <code>docs/readme.tsx</code> with the
          project CLI, so documentation examples exercise the same package entry points users call.
        </p>
        {shell("pnpm docs:readme\npnpm docs:check")}
      </Section>
      <Section title="Packages">
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(([name, purpose]) => (
              <tr>
                <td>
                  <code>{name}</code>
                </td>
                <td>{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Examples">
        <ul>
          <li>
            <code>examples/readme.tsx</code>: README generation from TSX.
          </li>
          <li>
            <code>examples/pr-comment.tsx</code>: GitHub pull request comment generation with
            conditional sections.
          </li>
          <li>
            <code>examples/migrate.md</code> and <code>examples/migrate.tsx</code>: migration input
            and TSX output.
          </li>
        </ul>
      </Section>
      <Section title="Standards">
        <p>
          Markdown behavior follows CommonMark where possible, GitHub Flavored Markdown for GFM
          features, GitHub Docs for GitHub-only syntax, mdast for migration semantics, and explicit
          adapters for non-portable syntax.
        </p>
      </Section>
      <RawMarkdown>
        {"<!-- Generated from docs/readme.tsx. Do not edit README.md by hand. -->"}
      </RawMarkdown>
    </Section>
  </Doc>
);
