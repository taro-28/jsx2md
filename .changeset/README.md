# Changesets

Use `pnpm changeset` to record package-facing changes before a manual npm release.

This repository intentionally does not include an automatic publish workflow. Run `pnpm version-packages` only when preparing a release, review the generated changelog changes, and publish manually after npm ownership and package access are confirmed.
