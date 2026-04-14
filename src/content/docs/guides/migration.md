---
title: Migration
description: Move connections into dssh, between machines, and between storage modes.
---

import { Steps, Aside } from '@astrojs/starlight/components';

dssh plays nicely with the files you already have. This page covers three common paths: coming from `~/.ssh/config`, moving your store to a new machine, and switching between parse modes.

## From an existing `~/.ssh/config`

You don't have to import anything — dssh can read your existing config file directly.

<Steps>

1. Run `dssh config` and pick **ssh_config only** or **Both**.
2. When prompted for the destination, choose:
   - **Main file** (`~/.ssh/config`) if everything lives in one file today, or
   - **Directive file** (`~/.ssh/config.d/dssh`) if you want dssh's additions kept separate.
3. Done. `dssh ls` now shows your existing hosts.

</Steps>

<Aside type="tip">
If you choose the directive-file approach, make sure your main `~/.ssh/config` includes it:

```text
Include ~/.ssh/config.d/dssh
```

Without that `Include` line, plain `ssh` won't see the entries dssh writes there.
</Aside>

### Which fields round-trip?

dssh reads and writes these `Host` block fields:

| Field            | dssh field       |
| ---------------- | ---------------- |
| `HostName`       | Host             |
| `User`           | User             |
| `Port`           | Port             |
| `IdentityFile`   | Identity file    |

Anything else (`ProxyJump`, `ForwardAgent`, `StrictHostKeyChecking`, custom `Match` blocks, …) is preserved untouched but not exposed in the TUI. If you edit one of those hosts in the TUI, the extra lines remain intact.

### `ssh_config` limitations to be aware of

- **No password storage.** OpenSSH has no mechanism for storing passwords in `ssh_config`. dssh refuses to write password-auth entries to `ssh_config` and directs you to SQLite instead.
- **No per-host remote directory on connect.** The "land in this directory" feature writes a wrapper command that isn't representable in `ssh_config`. Connections saved to `ssh_config` don't carry the `-d` value.

If either of those matters for a host, save it to SQLite (use **Both** mode and pick SQLite at save time, or use the `--sqlite` flag).

## Across machines

The database is a self-contained SQLite file. Move it where you need it.

### Manual copy

```sh
# On the source machine
scp ~/.dssh/dssh.db new-machine:~/.dssh/dssh.db
```

Create `~/.dssh/` on the destination first if it doesn't exist (`mkdir -p ~/.dssh && chmod 700 ~/.dssh`). Run `dssh ls` on the new machine to confirm.

The master passphrase travels in your head — you'll need it on the new machine to unlock stored passwords. The salt and the encrypted `passphrase_check` token are part of the DB, so verification works immediately.

### Via dotfiles / sync tools

If you sync dotfiles with chezmoi, yadm, git, or similar:

- **Include**: `~/.dssh/dssh.db`
- **Exclude / ignore**: `~/.dssh/dssh.db-wal`, `~/.dssh/dssh.db-shm` (SQLite WAL artifacts)

With Syncthing / Dropbox / iCloud, close dssh before syncing to avoid copying the WAL mid-write. Consider running `sqlite3 ~/.dssh/dssh.db "VACUUM;"` before a sync to roll the WAL into the main file.

### Backup strategy

The DB is small (tens of KB for typical use) — throw it in whatever backup you run for dotfiles. For an encrypted backup independent of dssh's own encryption, `age` or `gpg` over the file works fine:

```sh
age -p -o dssh.db.age ~/.dssh/dssh.db
```

## Switching parse modes

You can change modes any time without data loss — `dssh config` never deletes.

### SQLite only → Both

Painless. Your SQLite entries remain; dssh starts reading `ssh_config` on top.

```sh
dssh config    # pick "Both", then pick an ssh_config destination
```

After switching, `dssh ls` shows an extra `SOURCE` column so you can tell entries apart.

### Both → SQLite only

`ssh_config` entries stop appearing in `dssh ls`. They're not deleted — plain `ssh` still reads them. If you want them *in* SQLite, the only supported path today is re-adding them via `dssh add` or the Create TUI.

### Promoting an `ssh_config` entry to SQLite (e.g. to attach a password)

<Steps style="margib-bottom:">

1. In **Both** mode, `dssh edit` the entry.
2. Note its details (or leave the edit form open in another terminal).
3. `dssh add NEWNAME user@host` (or use Create TUI tab) and save to SQLite. Use `--sqlite` to bypass the target prompt.
4. Remove the `ssh_config` copy with `dssh delete` or by editing the file directly.

</Steps>

There's no built-in "move to other store" action today — the dual-source cross-duplicate check is deliberate, to prevent accidental shadowing.

## From another SSH manager

There's no importer for tools like sshm, sshs, lazyssh, etc. If they can export to `ssh_config` format (most can), the simplest path is:

<Steps>

1. Export from the old tool to `~/.ssh/config` or a directive file.
2. Run `dssh config` and point dssh at that file in **ssh_config** or **Both** mode.
3. `dssh ls` — your hosts show up.

</Steps>

## Uninstalling

To remove dssh *and* its data:

```sh
# Remove the binary (path depends on how you installed)
rm "$(command -v dssh)"

# Wipe data (connections, encrypted passwords, settings)
rm -rf ~/.dssh
```

`ssh_config` entries written by dssh remain — they're part of your personal ssh config, not owned by dssh. Delete the directive file or the relevant `Host` blocks by hand if you want a clean slate there too.
