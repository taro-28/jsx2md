# jsx2md

Core renderer, JSX runtime, standard Markdown components, and adapter definitions for `jsx2md`.

## API

- `render(node, options)` renders a JSX tree or runtime node to Markdown.
- `/** @jsxImportSource jsx2md */` enables the custom JSX runtime.
- `Doc`, `Section`, `Heading`, and `RawMarkdown` provide document-level primitives.
- Intrinsic components such as `h1`, `p`, `ul`, `table`, `code`, and `pre` map to Markdown syntax.

The core package intentionally avoids parser, CLI, and migration dependencies.
