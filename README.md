# jsx2md

`jsx2md` generates Markdown from JSX and TSX without React. It is designed for programmatic README generation, GitHub pull request comments, and migration from hand-written Markdown to typed TSX documents.

> Version `0.0.1` is an initial implementation. The repository is not configured for publishing.

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
jsx2md check docs/readme.tsx -o README.md
jsx2md migrate README.md -o docs/readme.tsx --adapter github
```

## Packages

- `jsx2md`: core renderer, JSX runtime, basic Markdown components, and adapters.
- `@jsx2md/github`: GitHub/GFM adapter and GitHub-only components.
- `@jsx2md/migrate`: Markdown to TSX migration utilities.
- `@jsx2md/cli`: the `jsx2md` command.

## Standards

Markdown output follows CommonMark where possible, GitHub Flavored Markdown for GFM features, and GitHub Docs for GitHub-only syntax.
