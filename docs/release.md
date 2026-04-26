# Release Preparation

The repository is prepared for manual releases only. Do not publish packages or push release tags until maintainers explicitly decide the npm owner, access level, and release timing.

## Manual Flow

1. Run `pnpm check`.
2. Add a changeset with `pnpm changeset` for package-facing changes.
3. Run `pnpm version-packages` and review generated version and changelog changes.
4. Run `pnpm check` again.
5. Run `pnpm -r --sort pack` or `pnpm pack:smoke` to inspect package contents.
6. Publish manually with npm credentials after ownership is confirmed.

No GitHub Actions release workflow is configured.
