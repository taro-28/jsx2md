# @jsx2md/migrate

Markdown to TSX migration utilities for `jsx2md`.

`migrateMarkdown(source, options)` converts CommonMark and GFM Markdown into TSX that renders back through `jsx2md`. The converter prioritizes semantic preservation over byte-for-byte formatting. Unsupported nodes and embedded HTML are preserved with `RawMarkdown` and diagnostics.

Generated TSX includes JSX runtime pragma comments by default for standalone CLI use. Pass `{ pragma: false }` when the target project already configures `jsxImportSource`.
