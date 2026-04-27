# jsx2md v0.0.1 Specification

## Goal

`jsx2md` is a TypeScript library for generating Markdown from JSX and TSX. It provides a first-class programmatic `render()` API, a CLI for rendering TSX entries, GitHub-specific Markdown extensions, and a migration tool that converts existing Markdown into editable TSX.

## Package Model

The repository is a pnpm monorepo:

- `packages/core` publishes `jsx2md`.
- `packages/gfm` publishes `@jsx2md/gfm`.
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

Projects usually enable TSX usage once in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "jsx2md"
  }
}
```

Standalone TSX entries can instead use a per-file pragma:

```tsx
/** @jsxImportSource jsx2md */
```

## Components

Core components cover portable Markdown building blocks: documents, fragments, raw Markdown, headings, sections, paragraphs, lists, block quotes, inline code, fenced code, links, images, tables, rules, line breaks, details blocks, keyboard tags, anchors, diagrams rendered as fences, and semantic admonitions.

`Section` and `Heading` support automatic heading depth. Rendering fails when automatic depth would exceed `h6`.

GFM components live in `@jsx2md/gfm` and cover task lists, footnotes, and strikethrough text.

GitHub components live in `@jsx2md/github` and cover GitHub alerts, suggestions, references, mentions, colors, emoji, and GitHub-specific diagrams.

## Adapters

Adapters describe output capabilities:

- `markdown`: portable Markdown.
- `gfm`: GitHub Flavored Markdown.
- `github`: GitHub Markdown for repositories, issues, pull requests, and comments.

Unsupported syntax throws clear errors by default. Users can opt in to `unsupported: "plain"` for readable fallback output or `unsupported: "omit"` to remove unsupported wrappers while preserving child content.

## CLI

The CLI supports:

```sh
jsx2md render <entry.tsx> -o README.md --adapter github --props props.json
jsx2md render <entry.tsx> --adapter markdown --unsupported plain
jsx2md render <entry.tsx>
jsx2md check <entry.tsx> -o README.md
jsx2md migrate <input.md> -o <output.tsx> --adapter github
jsx2md migrate <input.md> -o <output.tsx> --adapter github --no-pragma
```

TSX entries should default-export either a JSX node or a function that receives JSON props.

## Migration

Migration converts Markdown to TSX using mdast. It prioritizes semantic preservation over byte-for-byte formatting. Unknown nodes and embedded HTML are preserved through a raw Markdown escape hatch so conversion does not silently drop content.

Generated TSX includes JSX runtime pragma comments by default so migrated files work as standalone CLI entries. Users can pass `pragma: false` to `migrateMarkdown()` or `--no-pragma` to the CLI when their project already configures `jsxImportSource`.

## Standards

- CommonMark: <https://spec.commonmark.org/spec>
- GitHub Flavored Markdown: <https://github.github.io/gfm/>
- mdast: <https://github.com/syntax-tree/mdast>
- remark: <https://unifiedjs.com/explore/package/remark/>
- GitHub formatting docs: <https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax>
