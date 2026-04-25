# jsx2md v0.0.1 Specification

## Goal

`jsx2md` is a TypeScript library for generating Markdown from JSX and TSX. It provides a first-class programmatic `render()` API, a CLI for rendering TSX entries, GitHub-specific Markdown extensions, and a migration tool that converts existing Markdown into editable TSX.

## Package Model

The repository is a pnpm monorepo:

- `packages/core` publishes `jsx2md`.
- `packages/github` publishes `@jsx2md/github`.
- `packages/migrate` publishes `@jsx2md/migrate`.
- `packages/cli` publishes `@jsx2md/cli` and the `jsx2md` binary.

All packages start at version `0.0.1`. The root package is private. No publishing workflow is included.

## Core API

The primary API is:

```ts
render(node, options);
```

The renderer accepts JSX nodes created by the custom JSX runtime and returns a Markdown string. It also exports runtime helpers for non-JSX usage.

TSX usage is enabled with:

```tsx
/** @jsxImportSource jsx2md */
```

## Components

Core components cover portable Markdown building blocks: documents, fragments, raw Markdown, headings, sections, paragraphs, lists, block quotes, inline code, fenced code, links, images, tables, rules, and line breaks.

`Section` and `Heading` support automatic heading depth. Rendering fails when automatic depth would exceed `h6`.

GitHub components live in `@jsx2md/github` and cover GitHub alerts, task lists, details blocks, suggestions, code fences, diagrams, references, mentions, footnotes, colors, emoji, keyboard tags, anchors, and strikethrough text.

## Adapters

Adapters describe output capabilities:

- `markdown`: portable Markdown.
- `gfm`: GitHub Flavored Markdown.
- `github`: GitHub Markdown for repositories, issues, pull requests, and comments.

GitHub-only components must throw clear errors when rendered with an adapter that does not support them.

## CLI

The CLI supports:

```sh
jsx2md render <entry.tsx> -o README.md --adapter github --props props.json
jsx2md render <entry.tsx>
jsx2md check <entry.tsx> -o README.md
jsx2md migrate <input.md> -o <output.tsx> --adapter github
```

TSX entries should default-export either a JSX node or a function that receives JSON props.

## Migration

Migration converts Markdown to TSX using mdast. It prioritizes semantic preservation over byte-for-byte formatting. Unknown nodes and embedded HTML are preserved through a raw Markdown escape hatch so conversion does not silently drop content.

## Standards

- CommonMark: <https://spec.commonmark.org/spec>
- GitHub Flavored Markdown: <https://github.github.io/gfm/>
- mdast: <https://github.com/syntax-tree/mdast>
- remark: <https://unifiedjs.com/explore/package/remark/>
- GitHub formatting docs: <https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax>
