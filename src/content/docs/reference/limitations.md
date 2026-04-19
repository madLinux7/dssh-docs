---
title: Limitations
description: What dssh currently does not do — listed so you can plan around it.
---

dssh is deliberately minimal. Some things are on the roadmap, some are by design, some are just "nobody has filed a PR yet." This page tells you which is which.

## By design

### A small set of connection fields are managed

dssh tracks **name, user, host, port, directory, ProxyJump, identity file, and (optional) password** per connection — nothing else. Anything more exotic (`ProxyCommand`, `ForwardAgent`, `StrictHostKeyChecking`, `Match`, …) belongs in `~/.ssh/config`, where `ssh` will honor it regardless of how you reach it through dssh.

### No custom SSH config parser

The built-in `ssh_config` reader recognises `HostName`, `User`, `Port`, `IdentityFile`, `ProxyJump`, and the specific `RemoteCommand` pattern dssh itself writes (`cd '...' && exec $SHELL -l`). It deliberately ignores:

- Wildcard / pattern hosts (`Host *`, `Host foo?`)
- `Match` blocks
- Every other directive

They stay in the file untouched — dssh just doesn't surface them in the TUI or list output.

### No password storage in `ssh_config`

OpenSSH has no mechanism for storing passwords in `ssh_config`, and dssh will not invent one. Password-auth hosts live in SQLite; attempts to save them to `ssh_config` are refused with a clear error.

### No master-passphrase recovery

Argon2id + no stored passphrase means a forgotten passphrase is permanent. `dssh reset` is the only path back, and it wipes *all* encrypted data. This is a security property, not a missing feature.

### No shell completion shipped

Cobra's auto-generated completion command is explicitly disabled. Generating completions for bash / zsh / fish is a small PR if you want them — see [Contributing](/contributing/).

## Roadmap (not there yet)

These are things dssh *could* reasonably do and may in future versions. Open an issue or PR if you need them sooner.

### In-place passphrase change

To rotate the master passphrase today, you `dssh reset` and re-add password hosts. A proper `dssh passphrase change` that re-encrypts every stored password with a new key is tracked.

### Per-host re-encryption / passphrase test

No command exists to verify the passphrase without actually connecting to something, and no command re-encrypts a single host.

### Native `ssh_config → SQLite` / `SQLite → ssh_config` move

Today, "promoting" a host from one store to the other is a manual re-add. A first-class move command is wanted but not yet implemented.

### Configurable data-directory path

`~/.dssh/dssh.db` is hard-coded relative to `$HOME`. No `DSSH_HOME` / `DSSH_DB_PATH` env var is honoured. Workaround: override `$HOME` for the invocation.

### Group / tag / folder structure

Connections are flat. No nesting, no tags, no "dev / staging / prod" groups. Fuzzy search on the name / user / host string covers most organisation needs in practice.

### `ssh-agent` key management

dssh does nothing with `ssh-agent` itself — it just lets `ssh` pick up whatever agent you have running. There's no "add this identity to my agent on connect" feature.

## Platform caveats

### Windows: no `syscall.Exec`

On Unix, key auth replaces the dssh process with `ssh` via `syscall.Exec` — zero wrapper overhead. Windows has no equivalent, so dssh runs `ssh` as a child process there with `Setsid`-style detachment. Functionally identical, slightly higher startup overhead.

### WSL ↔ Windows file permissions

Keys stored on the Windows side and accessed from WSL (`/mnt/c/...`) have permissions `0777` via the 9p bridge, which OpenSSH rejects. Copy the key into the WSL home and `chmod 600` — see [Troubleshooting → WSL quirks](/guides/troubleshooting/#wsl-quirks).

### 32-bit architectures

No 32-bit binaries are published. The code has no architecture-specific bits, so `go build` on a 32-bit host should work — you're on your own for testing.

## Intentionally not doing

### Key generation

There is no `dssh keygen`. Use `ssh-keygen`. Managing a key lifecycle is out of scope for a connection manager.

### Host-key verification / known_hosts management

dssh does not touch `~/.ssh/known_hosts`. `ssh` handles host-key checking exactly as it would on the command line. If you need to clear a known_host, use `ssh-keygen -R host`.

### Port forwarding shortcuts

You can pass `-L` / `-R` via `dssh NAME -- -L 8080:localhost:80`, but dssh doesn't store forward rules as first-class fields. Hosts with persistent forwards are a good use case for `ssh_config` with `LocalForward` / `RemoteForward` entries.

### Connection health checks / ping

dssh does not pre-check reachability before calling `ssh`. You'll get the same "Connection refused" or "Connection timed out" error you'd get from bare `ssh`, neither sooner nor with extra diagnostics.
