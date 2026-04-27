# Agent Guidelines

This repository is English-only. Keep tracked source, documentation, tests, package metadata, workflow names, and commit messages in English.

## Engineering Principles

- Keep `jsx2md` core lightweight. Parser, migration, CLI, and GitHub-only dependencies must stay outside the core package.
- Make adapters explicit. Components that depend on non-portable behavior must fail clearly when rendered with an unsupported adapter.
- Unsupported content must not be silently dropped by default; use explicit fallback policies when loss or simplification is intended.
- Follow standards first: CommonMark for portable Markdown, GitHub Flavored Markdown for tables/task lists/footnotes, and GitHub Docs for GitHub-only extensions.
- Treat `render()` as the primary API. The CLI is a convenience layer over the same behavior.
- Public APIs require tests covering behavior and types.
- Migration must preserve content semantically and must not silently drop unknown Markdown.
- Do not publish packages or push branches unless the user explicitly asks for it.

## Tooling

- Use Oxfmt for formatting.
- Use Oxlint with all rules and nursery rules enabled, disabling only rules that are documented in configuration and unsuitable for this repository.
- Use `@tsconfig/strictest` as the TypeScript baseline.
- Use Knip to detect unused files, dependencies, and exports.
