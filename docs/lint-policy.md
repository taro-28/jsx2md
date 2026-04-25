# Lint Policy

Oxlint runs with all stable rules and nursery rules enabled:

```sh
oxlint -D all -D nursery --type-aware --type-check .
```

The `scripts/lint.mjs` wrapper keeps that command shape and adds explicit `-A` entries for rules that conflict with this repository's requirements:

- Library packages require named exports, subpath exports, and JSX runtime namespaces.
- Node-based CLI and repository scripts need Node built-ins, console output, process exit codes, and parent-directory imports.
- Renderer code intentionally uses dense dispatch functions because splitting every Markdown branch would make behavior harder to audit.
- Tests intentionally import Vitest APIs directly and use compact assertions without per-test timeouts.
- TypeScript and Markdown code contains common short identifiers such as JSX intrinsic names and Markdown heading levels.

Rules should be re-enabled when the codebase can satisfy them without weakening the public API or making the renderer harder to maintain.
