# @jsx2md/cli

CLI for rendering `jsx2md` TSX entries and migrating Markdown files.

## Commands

```sh
jsx2md render <entry.tsx> -o README.md --adapter github --props props.json
jsx2md render <entry.tsx> --adapter markdown --unsupported plain
jsx2md check <entry.tsx> -o README.md --adapter github
jsx2md migrate <input.md> -o <output.tsx> --adapter github
jsx2md migrate <input.md> -o <output.tsx> --adapter github --no-pragma
```

`check` exits with `1` and prints a unified diff when generated output differs from the target file.
`render` and `check` throw on unsupported syntax by default. Use `--unsupported plain` or `--unsupported omit` only when fallback output is intentional.
`migrate` includes JSX runtime pragma comments by default. Use `--no-pragma` when the target project already configures `jsxImportSource`.
