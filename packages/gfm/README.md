# @jsx2md/gfm

GitHub Flavored Markdown components for `jsx2md`.

## Components

- `TaskList`, `TaskItem`
- `Footnote`, `FootnoteRef`
- `Strikethrough`

These components render with the `gfm` and `github` adapters. Rendering with the portable `markdown` adapter throws by default; pass `unsupported: "plain"` or `unsupported: "omit"` when a readable fallback is acceptable.
