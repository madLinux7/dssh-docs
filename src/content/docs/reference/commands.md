---
title: Command reference
description: Every dssh command, flag, and alias — with examples.
---

All commands are backed by [Cobra](https://github.com/spf13/cobra). `--help` works on every subcommand.

## Synopsis

```text
dssh [NAME] [-- extra-ssh-args...]
dssh <command> [flags] [args]
```

Run `dssh` with no arguments to open the TUI. Run `dssh NAME` to connect straight to a saved host.

## Global flags

These apply to every subcommand. Mode-override flags are **one-shot** — they do not persist to the saved configuration.

| Flag           | Effect                                                            |
| -------------- | ----------------------------------------------------------------- |
| `--sqlite`     | Use SQLite-only mode for this invocation, regardless of config    |
| `--sshconfig`  | Use ssh_config-only mode for this invocation                      |
| `--both`       | Use both mode for this invocation (SQLite is the default save target) |
| `--version`    | Print the version and exit                                        |
| `--help`, `-h` | Print help for the current command                                |

## Connect

### `dssh` — interactive picker

```sh
dssh
```

Opens the TUI on the **Connect** tab (or **Create**, if no connections exist).

### `dssh NAME` — direct connect

```sh
dssh myserver
dssh myserver -- -v -L 8080:localhost:80
```

Anything after `--` is forwarded verbatim to `ssh`.

- Key auth replaces the dssh process with `ssh` via `syscall.Exec` on Unix (zero wrapper overhead, native job control).
- Password auth runs `ssh` as a child with `SSH_ASKPASS` pointed at a short-lived script that echoes the decrypted password. The script is created with mode `0700` in `$TMPDIR` and removed on exit.

## Manage connections

### `dssh add`

```text
dssh add [-p PORT] [-d DIR] [-J JUMP] [--sqlite | --sshconfig] NAME target [password]
```

Save a new connection without touching the TUI.

| Flag                    | Short | Description                                                |
| ----------------------- | ----- | ---------------------------------------------------------- |
| `--port`                | `-p`  | SSH port (default `22`). Overrides a port in an `ssh://` URI |
| `--directory`           | `-d`  | Remote directory to `cd` into on connect                   |
| `--proxy-jump`          | `-J`  | ProxyJump host — threaded through to `ssh -J`. Accepts `user@bastion`, `bastion.example.com`, or a chain `host1,host2` |
| `--sqlite`              |       | Force save to SQLite (bypasses `both`-mode prompt)         |
| `--sshconfig`           |       | Force save to `ssh_config` (bypasses `both`-mode prompt)   |

**Target** accepts either form:

- `user@host`
- `ssh://user@host:port`

**Password** (optional third positional) triggers password auth. It can only be saved to SQLite.

```sh
# key auth, default port
dssh add myserver root@192.168.1.10

# custom port via flag
dssh add myserver -p 2222 root@192.168.1.10

# custom port via URI
dssh add myserver ssh://root@192.168.1.10:2222

# land in /var/www on connect (passes -t to ssh + a cd+exec $SHELL -l)
dssh add webhost -d /var/www deploy@web.example.com

# through a jump host (maps to ssh -J)
dssh add db01 -J jumpuser@bastion.example.com dbadmin@10.0.1.50

# through a chain of jump hosts
dssh add db01 -J jump1.example.com,jump2.example.com dbadmin@10.0.1.50

# password auth — prompts for master passphrase on first use
dssh add prodbox deploy@10.0.0.5 'hunter2'
```

### `dssh rm NAME`

```sh
dssh rm myserver
```

Delete a connection by name. **No confirmation** — use `dssh delete` for the triple-confirm TUI.

### `dssh list` / `dssh ls`

```sh
dssh ls
```

Lists saved connections. In `both` mode, a `SOURCE` column is added so you can see which store each host lives in.

### `dssh create` / `dssh new`

```sh
dssh create
```

Opens the TUI wizard on the Create tab. Toggle key ↔ password auth with `Ctrl+T`.

### `dssh edit`

```sh
dssh edit
```

Opens the TUI on the Edit tab. Pick a connection, change any field, save. Auth-type switching is supported — switching to password prompts for the master passphrase.

### `dssh delete`

```sh
dssh delete
```

Opens the TUI on the Delete tab. Press `Enter` three times on the same item within 1 second to confirm. Safer than `dssh rm` when you're not 100% sure of the name.

## Configure

### `dssh config`

```sh
dssh config
```

Reopens the storage-mode dialog. Choose SQLite-only, ssh_config-only, or both. When picking a mode that writes to `ssh_config`, select the destination file (main config, directive file, or custom path).

### `dssh config get` / `dssh config show`

```sh
dssh config get
```

Prints the active configuration:

```text
parse_mode:                      both
ssh_config_parse_destination:    ~/.ssh/config.d/dssh
parse_both_view_mode:            sqlite
parse_both_default_save_target:  sqlite
```

## Reset

### `dssh reset`

```sh
dssh reset
```

Deletes `~/.dssh/dssh.db` entirely — connections, encrypted passwords, salt, passphrase verifier, all of it. Requires two confirmations (`yes`, then type `reset` literally). `ssh_config` entries are untouched.

## Reserved names

These names collide with CLI commands and are rejected by `dssh add` and the Create/Edit TUI:

```
add, rm, list, ls, new, create, edit, delete, reset, help, config
```

Pick a connection name outside that set.

## Exit codes

| Code | Meaning                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | Success (or the remote `ssh` session exited cleanly)              |
| `1`  | dssh-side error — bad flags, validation, DB failure, crypto error |
| other| Propagated from `ssh` when password auth is used                  |

When key auth is used, dssh has already `exec`'d into `ssh` by the time the session runs, so the exit code you see is `ssh`'s.
