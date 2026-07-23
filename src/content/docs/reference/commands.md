---
title: Command reference
description: Every dssh command, flag, and alias — with examples.
---

All commands are backed by [Cobra](https://github.com/spf13/cobra). `--help` works on every subcommand.

## Synopsis

```text
dssh [NAME] [-- extra-ssh-args...]
dssh connect NAME [-- extra-ssh-args...]
dssh <command> [flags] [args]
```

Run `dssh` with no arguments to open the TUI. Run `dssh NAME` to connect straight to a saved host.

## Global flags

These apply to every subcommand. Mode-override flags are **one-shot** — they do not persist to the saved configuration. Use at most one of `--sqlite`, `--sshconfig`, and `--both`.

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

Opens the two-pane TUI on **Connect**, where the right pane filters connections by group. If no connections exist, it opens **Create** instead, with **Assign Groups** in the right pane.

Direct `dssh NAME` connections are unchanged.

### `dssh NAME` — direct connect

```sh
dssh myserver
dssh myserver -- -v -L 8080:localhost:80
```

Anything after `--` is forwarded verbatim to `ssh`.

- Key auth replaces the dssh process with `ssh` via `syscall.Exec` on Unix (zero wrapper overhead, native job control).
- Password auth runs `ssh` as a child with `SSH_ASKPASS` pointed at a short-lived script that echoes the decrypted password. The script is created with mode `0700` in `$TMPDIR` and removed on exit.

### `dssh connect NAME` — explicit connect

```sh
dssh connect myserver
dssh connect myserver -- -v -L 8080:localhost:80
```

Equivalent to direct connect. Use this form to open a pre-existing connection named `group`, which now collides with the group command:

```sh
dssh connect group
```

## Manage connections

### `dssh add`

```text
dssh add [-p PORT] [-d DIR] [-J JUMP] [--group GROUP]... [--sqlite | --sshconfig] NAME target [password]
```

Save a new connection without touching the TUI.

| Flag                    | Short | Description                                                |
| ----------------------- | ----- | ---------------------------------------------------------- |
| `--port`                | `-p`  | SSH port (default `22`). Overrides a port in an `ssh://` URI |
| `--directory`           | `-d`  | Remote directory to `cd` into on connect                   |
| `--proxy-jump`          | `-J`  | ProxyJump host — threaded through to `ssh -J`. Accepts `user@bastion`, `bastion.example.com`, or a chain `host1,host2` |
| `--group`               |       | Assign an existing group; repeat for multiple groups       |
| `--sqlite`              |       | Force save to SQLite (bypasses `both`-mode prompt)         |
| `--sshconfig`           |       | Force save to `ssh_config` (bypasses `both`-mode prompt)   |

Groups must already exist. dssh resolves every group before creating the connection. SQLite saves connection + memberships in one transaction; failed `ssh_config` metadata assignment removes the new entry.

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

# assign existing groups while adding
dssh add api --group Production --group Europe deploy@api.example.com
```

### `dssh rm NAME`

```sh
dssh rm myserver
```

Delete a connection by name. **No confirmation** — use `dssh delete` for the triple-confirm TUI.

### `dssh list` / `dssh ls`

```sh
dssh ls
dssh list --group Production
dssh list --group Production --group Staging
dssh list --ungrouped
dssh list --json
```

Lists saved connections. In `both` mode, a `SOURCE` column is added so you can see which store each host lives in.

Repeat `--group` for an OR filter: a connection is shown when it belongs to any named group. An unknown group prints no human rows; JSON returns `[]`.

`--ungrouped` shows connections with no memberships in their active source. It cannot be combined with `--group`. Unlike this flag, the TUI's `(No Groups)` row removes the group filter and shows all connections.

`--json` adds `source` and source-scoped `groups` to safe connection fields. Encrypted passwords and nonces are never included.

### `dssh create` / `dssh new`

```sh
dssh create
```

Opens the TUI wizard on Create. The right pane assigns any number of groups with `Space`; `Ctrl+N` creates a group, `Ctrl+T` toggles key ↔ password auth, and `Ctrl+S` saves from either pane.

### `dssh edit`

```sh
dssh edit
```

Opens the TUI on Edit. Filter the list by connection text and group, select a connection, then edit its fields and group assignments. `Ctrl+S` saves from either pane.

Auth-type switching is supported. Switching to password prompts for the master passphrase.

### `dssh delete`

```sh
dssh delete
```

Opens the TUI on Delete. Filter by connection text and group, then press `Enter` three times on the same item within 1 second. This is safer than `dssh rm` when you're not 100% sure of the name.

## Groups

Group names are case-insensitive. A connection can belong to multiple groups.

| Command                                        | Effect                                                    |
| ---------------------------------------------- | --------------------------------------------------------- |
| `dssh group list [--json]`                     | List groups with membership counts for active source(s)   |
| `dssh group create NAME`                       | Create a group                                            |
| `dssh group rename NAME NEW_NAME`              | Rename a group and keep its memberships                   |
| `dssh group delete NAME`                       | Delete a group and its memberships immediately            |
| `dssh group assign GROUP CONNECTION...`        | Assign one or more connections                            |
| `dssh group unassign GROUP CONNECTION...`      | Remove one or more assignments                            |

Group deletion has no confirmation flag and never deletes connections.

```sh
dssh group create Production
dssh group assign Production api web
dssh group unassign Production web
dssh group rename Production Live
dssh group list
dssh group delete Live
```

Groups are global SQLite metadata. Memberships are source-scoped: equally named SQLite and `ssh_config` connections can have different groups. `ssh_config` memberships are also scoped to the configured file path.

Reads span active sources. `group list` shows counts for each active source. Its JSON items contain `name`, `sqlite_count`, and `ssh_config_count`; counts for unselected sources are `null`.

In configured `both` mode, membership writes require exactly one source override:

```sh
dssh --sqlite group assign Production api
dssh --sshconfig group assign Production api
```

`--both` is invalid for membership writes. Group and connection reads can still use `both` mode.

`assign` and `unassign` validate the group and every connection before writing. Repeated connection names are deduplicated, operations are idempotent, and the whole batch succeeds or fails as one membership transaction.

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

Deletes `~/.dssh/dssh.db` entirely — SQLite connections, encrypted passwords, groups, memberships, settings, salt, and passphrase verifier. Requires two confirmations (`yes`, then type `reset` literally).

`ssh_config` host entries are untouched. Their group memberships are removed because that metadata lives in the SQLite database.

## Reserved names

These names collide with CLI commands and are rejected by `dssh add` and the Create/Edit TUI:

```
add, rm, list, ls, new, create, edit, delete, group, connect, reset, help, config
```

Pick a connection name outside that set.

## Exit codes

| Code | Meaning                                                           |
| ---- | ----------------------------------------------------------------- |
| `0`  | Success (or the remote `ssh` session exited cleanly)              |
| `1`  | dssh-side error — bad flags, validation, DB failure, crypto error |
| other| Propagated from `ssh` when password auth is used                  |

When key auth is used, dssh has already `exec`'d into `ssh` by the time the session runs, so the exit code you see is `ssh`'s.
