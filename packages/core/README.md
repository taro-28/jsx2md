# jsx2md

Core renderer, JSX runtime, CommonMark-oriented components, and adapter definitions for `jsx2md`.

## API

- `render(node, options)` renders a JSX tree or runtime node to Markdown.
- `jsxImportSource: "jsx2md"` in `tsconfig.json` enables the custom JSX runtime for a project.
- `/** @jsxImportSource jsx2md */` can enable the runtime for standalone TSX files.
- `Doc`, `Section`, `Heading`, `RawMarkdown`, `Admonition`, `Details`, `Diff`, `Mermaid`, `Kbd`, and `Anchor` provide document-level and portable extension primitives.
- Intrinsic components such as `h1`, `p`, `ul`, `table`, `code`, and `pre` map to Markdown syntax.
- `unsupported: "error" | "plain" | "omit"` controls how unsupported syntax is handled. The default is `error`.

The core package intentionally avoids parser, CLI, and migration dependencies.
