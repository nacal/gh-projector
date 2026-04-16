# gh-projector

TUI kanban viewer for GitHub Projects v2. Available as a `gh` extension. Works with
github.com and GitHub Enterprise Server.

## Install

```sh
gh extension install nacal/gh-projector
```

Requires `gh` to be installed and authenticated (`gh auth login`, and for GHE
`gh auth login -h <host>`).

## Usage

```sh
gh projector --owner <owner> --number <n>
gh projector --host <ghe-host> --owner <owner> --number <n>
```

With a config file you can omit the flags:

```sh
gh projector
```

### Keybindings

| Key | Action |
| --- | --- |
| `←` / `h`, `→` / `l` | Move between columns |
| `↑` / `k`, `↓` / `j` | Move between items (scroll body in detail view) |
| `Enter` / `d` | Open detail view |
| `>` / `<` | Move item to next / previous status column |
| `/` | Filter items by title / assignee / label |
| `Esc` | Close detail view / help / clear filter |
| `o` | Open selected item in browser |
| `y` | Copy item URL to clipboard |
| `n` | Create new draft issue |
| `x` | Archive item (with confirmation) |
| `s` | Cycle sort: manual / title / updated / created / assignee |
| `v` | Toggle board / tabs layout |
| `V` | Pick a project view (fetched from GitHub) |
| `r` | Reload |
| `?` | Toggle help |
| `q` / `Ctrl+C` | Quit |

### Layout modes

- **Board**: all columns side-by-side (default when terminal is wide enough).
- **Tabs**: top tab bar + single-column list view (auto when terminal is narrow).
  Press `v` to override the auto choice.

## Configuration

`~/.config/gh-projector/config.json`:

```json
{
  "defaults": {
    "host": "github.com",
    "owner": "nacal",
    "number": 1,
    "columnField": "Status",
    "view": "Sprint Board"
  },
  "refreshIntervalSeconds": 0
}
```

- `defaults`: used when the corresponding flag is omitted.
- `columnField`: name of the SingleSelect field to group by. Defaults to `Status`,
  with fallback to the project's default status field if renamed.
- `refreshIntervalSeconds`: auto-reload interval. Omit or set to `0` to disable
  (default). Manual reload with `r` is always available.

## Development

```sh
bun install
bun run dev -- --owner <owner> --number <n>
bun run typecheck
bun run lint
bun run build     # compiles dist/gh-projector
```

## License

MIT
