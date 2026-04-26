# jsx2md

`jsx2md` generates Markdown from JSX and TSX without React. It is designed for typed README generation, GitHub pull request comments, and migration from hand-written Markdown to maintainable TSX documents.

> [!NOTE]
> Version `0.0.1` is an initial implementation. The repository is not configured for automatic publishing.

## Install

This repository uses pnpm workspaces.

```sh
pnpm install
pnpm build
```

## Programmatic API

```tsx
/** @jsxImportSource jsx2md */
import { Doc, render } from "jsx2md";

const markdown = render(
  <Doc>
    <h1>Release notes</h1>
    <p>Generated from typed TSX.</p>
  </Doc>,
);
```

## CLI

```sh
jsx2md render docs/readme.tsx -o README.md --adapter github
jsx2md render docs/readme.tsx --adapter github
jsx2md check docs/readme.tsx -o README.md --adapter github
jsx2md migrate README.md -o docs/readme.tsx --adapter github
```

Exit codes:

- `render`: `0` when Markdown is generated, `1` on load or render errors.
- `check`: `0` when output matches, `1` when output differs or an error occurs. Mismatches print a unified diff.
- `migrate`: `0` when TSX is generated, `1` on read, parse, or write errors. Preservation diagnostics are printed to stderr.

## Generated README

This `README.md` is generated from `docs/readme.tsx` with the project CLI, so documentation examples exercise the same package entry points users call.

```sh
pnpm docs:readme
pnpm docs:check
```

## Packages

| Package           | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `jsx2md`          | Core renderer, JSX runtime, Markdown components, and adapters. |
| `@jsx2md/github`  | GitHub Markdown adapter and GitHub-only components.            |
| `@jsx2md/migrate` | Markdown to TSX migration utilities.                           |
| `@jsx2md/cli`     | The `jsx2md` command for render, check, and migrate workflows. |

## Examples

- `examples/readme.tsx`: README generation from TSX.
- `examples/pr-comment.tsx`: GitHub pull request comment generation with conditional sections.
- `examples/migrate.md` and `examples/migrate.tsx`: migration input and TSX output.

## Standards

Markdown behavior follows CommonMark where possible, GitHub Flavored Markdown for GFM features, GitHub Docs for GitHub-only syntax, mdast for migration semantics, and explicit adapters for non-portable syntax.

<!-- Generated from docs/readme.tsx. Do not edit README.md by hand. -->
