---
title: Configuration
description: Parse modes, file locations, persistent settings, and one-shot flag overrides.
---

dssh keeps configuration minimal — everything fits in the `settings` table of the SQLite database. There are no YAML/TOML config files to edit; use `dssh config` (interactive) or the one-shot CLI flags.

## File locations

| Path                         | What lives there                                            |
| ---------------------------- | ----------------------------------------------------------- |
| `~/.dssh/dssh.db`            | SQLite database — connections, settings, crypto material    |
| `~/.ssh/config`              | Main ssh config (when selected as `ssh_config` destination) |
| `~/.ssh/config.d/dssh`       | Directive file (when selected)                              |
| Custom path                  | Any file you chose during `dssh config`                     |
| `$TMPDIR/dssh-askpass-*.sh`  | Short-lived askpass script (Unix; `.bat` on Windows)        |

The data dir is created with mode `0700` on first run. SQLite runs in WAL mode, so you'll also see `dssh.db-wal` and `dssh.db-shm` alongside the main file — these are normal SQLite artifacts.

## Parse modes

The **parse mode** controls where dssh reads and writes connections.

| Mode              | Setting value       | Read from            | Write to                                                   |
| ----------------- | ------------------- | -------------------- | ---------------------------------------------------------- |
| SQLite only       | `sqlite_only`       | SQLite               | SQLite                                                     |
| ssh_config only   | `ssh_config_only`   | `ssh_config` file    | `ssh_config` file (key auth only)                          |
| Both              | `both`              | Both                 | Prompted per-save, or forced by default / `--sqlite` / `--sshconfig` |

### `both` mode extras

When you're in `both` mode, two additional settings come into play:

- `parse_both_view_mode` — which list the TUI shows first (`sqlite` or `ssh_config`). Toggle live with `Ctrl+L`.
- `parse_both_default_save_target` — which store `dssh add` picks when you don't pass `--sqlite` / `--sshconfig`.

## Persistent settings (settings table)

Every persisted setting, by key:

| Key                                | Values                                           | Notes                                    |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `parse_mode`                       | `sqlite_only`, `ssh_config_only`, `both`         | Unset = first-run dialog is shown        |
| `parse_both_view_mode`             | `sqlite`, `ssh_config`                           | Only meaningful in `both` mode           |
| `parse_both_default_save_target`   | `sqlite`, `ssh_config`                           | Only meaningful in `both` mode           |
| `ssh_config_parse_destination`     | Absolute path                                    | Where to write `ssh_config` entries      |
| `argon2_salt`                      | 16 random bytes                                  | Crypto: per-install salt                 |
| `passphrase_check`                 | AES-GCM ciphertext + nonce of `"dssh-verify"`    | Crypto: passphrase-correctness token     |

Don't hand-edit these with `sqlite3` unless you know what you're doing — a bad `argon2_salt` or `passphrase_check` will lock you out of every stored password. Use `dssh config` for mode changes and `dssh reset` to start fresh.

## Inspect active config

```sh
dssh config get
```

```text
parse_mode:                      both
ssh_config_parse_destination:    ~/.ssh/config.d/dssh
parse_both_view_mode:            sqlite
parse_both_default_save_target:  sqlite
```

`dssh config show` is an alias for the same command.

## Change the mode

```sh
dssh config
```

Opens the same dialog shown on first run. Pick a mode; if you chose anything with `ssh_config`, pick the destination file. Existing SQLite data is preserved on mode changes; the dialog never deletes connections.

## One-shot flag overrides

Three persistent flags let you run a single command in a different mode without touching the saved config:

| Flag          | Effect for this invocation                                          |
| ------------- | ------------------------------------------------------------------- |
| `--sqlite`    | Behave as if mode is `sqlite_only`                                  |
| `--sshconfig` | Behave as if mode is `ssh_config_only`                              |
| `--both`      | Behave as if mode is `both`, defaulting to SQLite as the save target |

```sh
# One-off: list what ssh_config has, even though we're in SQLite-only mode
dssh --sshconfig ls

# One-off: add to ssh_config without switching modes
dssh --sshconfig add teambox deploy@team.example.com
```

## Environment

dssh reads standard environment variables used by `ssh` (it *is* ssh under the hood). It does **not** currently read custom variables for relocating `~/.dssh/` or `~/.ssh/config` — the paths above are hard-coded relative to the user's home directory. If you need a custom DB path, open an issue.

`SSH_ASKPASS` and `SSH_ASKPASS_REQUIRE` are set by dssh for password auth only, for the lifetime of the `ssh` child process. Your existing environment is preserved; `DISPLAY` is explicitly stripped to force `ssh` to use the askpass script instead of a GUI prompt.
