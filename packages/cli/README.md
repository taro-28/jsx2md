# @jsx2md/cli

CLI for rendering `jsx2md` TSX entries and migrating Markdown files.

## Commands

```sh
jsx2md render <entry.tsx> -o README.md --adapter github --props props.json
jsx2md check <entry.tsx> -o README.md --adapter github
jsx2md migrate <input.md> -o <output.tsx> --adapter github
```

`check` exits with `1` and prints a unified diff when generated output differs from the target file.
