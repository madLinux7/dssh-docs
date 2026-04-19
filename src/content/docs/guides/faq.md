---
title: FAQ
description: Answers to the questions people ask most often about dssh.
---

## General

### Is dssh a replacement for `ssh`?

No. dssh is a **front-end** for `ssh`. Under the hood it runs your system's ssh binary — same protocols, same config, same key handling. dssh just removes the "which of my 40 hosts was that?" friction and, optionally, stores passwords encrypted.

### Why not just edit `~/.ssh/config`?

You can — and dssh supports that mode directly. The value dssh adds:

- Fuzzy-searchable TUI over your hosts
- Encrypted password storage (ssh_config can't do this)
- Consistent CLI across machines, regardless of how you spell your config files

### Does dssh work offline?

Yes — it's a single static binary. The only network it speaks is the one your ssh connection uses. No telemetry, no phone-home, no update checks.

## Storage & portability

### Can I sync connections across machines?

Yes. `~/.dssh/dssh.db` is a normal SQLite file — copy it wherever. See [Migration](/guides/migration/) for details. The master passphrase travels with the file; you need it to unlock encrypted passwords on the new machine.

### Can I use dssh on top of my existing `~/.ssh/config`?

Yes. Pick `ssh_config only` or `both` mode on first run (or later via `dssh config`). dssh respects the file's existing entries and only adds its own `Host` blocks when you `add` or `create`.

### Where is data stored?

- `~/.dssh/dssh.db` — SQLite database (connections + settings + crypto material)
- `~/.ssh/config` or a path you chose — `ssh_config` entries
- `$TMPDIR/dssh-askpass-*.sh` — ephemeral askpass scripts, deleted after each password connect

See [Configuration → File locations](/reference/config/#file-locations) for the full list.

### Can I run multiple dssh installs with different databases?

Not via dssh itself — the DB path is hard-coded to `~/.dssh/dssh.db`. Workarounds:

- Override `$HOME` for the command: `HOME=/tmp/other dssh ls`
- Run dssh inside a container or WSL distro with a separate home

If you want first-class support for this, open a feature request.

## Security & passwords

### Can I use dssh without a master passphrase?

Yes — stick to **key auth only** and never save a password. dssh never prompts for a passphrase if you never store one. The master passphrase is set on first password save and not before.

### What happens if I forget the master passphrase?

The encrypted passwords are irretrievable. Run `dssh reset` to wipe the database and start over — key-auth connections re-add in seconds, and `ssh_config` entries are untouched by reset. See [Troubleshooting → Lost master passphrase](/guides/troubleshooting/#lost-master-passphrase).

### Does dssh support hardware-backed keys (YubiKey, SoloKey, Secure Enclave)?

Yes — anything your `ssh` binary supports, dssh supports, because it's the same binary. Save the connection as key-auth with no stored password; `ssh-agent` or `sk-ssh-agent` handles the hardware interaction exactly as it would on a bare `ssh` command.

### Can I change the master passphrase?

Not in-place today. `dssh reset` + re-add password hosts is the current path.

### Are my passwords visible in memory?

Briefly, yes — decrypted passwords live in process memory between the passphrase unlock and the moment `ssh` asks for them. They're never written to disk in plaintext. The askpass script file on Unix is mode `0700` and deleted after `ssh` exits.

## Usage

### Can I pass custom flags to ssh?

Yes — everything after `--` is forwarded:

```sh
dssh myserver -- -v -L 8080:localhost:80 -R 2222:localhost:22
```

### Does dssh support `ProxyJump`?

Yes — since v2.1.0 `ProxyJump` is a first-class field on every connection. Set it from the CLI with `dssh add -J user@bastion NAME target`, from the TUI in the **ProxyJump** form field, or by editing an existing connection. The value is threaded through to `ssh -J` on connect and, for ssh_config-backed entries, written as a `ProxyJump` directive. Chains are supported: `host1,host2`.

Anything you already have set up in `~/.ssh/config` still works — ssh resolves the jump regardless of how it was configured.

### Does dssh support SSH config directives beyond the basics?

dssh *reads* and *writes* a conservative subset (`HostName`, `User`, `Port`, `IdentityFile`, `ProxyJump`). Anything else you hand-author in your `ssh_config` is preserved and ignored by dssh — it won't round-trip through the TUI, but it won't be stripped on save either.

### Can I launch into a specific remote directory?

Yes — `dssh add myhost -d /var/www user@host` or set the field in the create/edit TUI. dssh adds `-t` to ssh and appends `cd '/var/www' && exec $SHELL -l` as the remote command, giving you a login shell in that directory.

### Does tab completion work?

Cobra's default completion command is disabled — the dssh author didn't ship generated completions in the v1 release. Adding them is a small PR if you want the feature.

## Build & distribution

### Which platforms have binaries?

Linux, macOS, Windows, FreeBSD — each on `amd64` and `arm64`. See [Releases](https://github.com/madLinux7/dssh/releases).

### Why is the binary so small?

The release pipeline uses `-ldflags` to strip debug info, `CGO_ENABLED=0` for static linking, and `upx` for executable compression. The result is roughly 3.3 MiB on Linux — a 64% reduction from the raw Go build.

### Can I build without UPX?

Yes — `make build` produces the static binary, `make release` is the one that runs UPX. If UPX isn't installed, `make build` is all you need.

### Does dssh work on 32-bit systems?

Not officially. Nothing in dssh *prevents* it — the code is architecture-agnostic Go — but no 32-bit binaries are published. Build from source if you need one.

## Community

### Where do I report bugs / request features?

[github.com/madLinux7/dssh/issues](https://github.com/madLinux7/dssh/issues).

### How do I contribute?

See the [Contributing](/contributing/) page.

### Is there a Discord / forum / mailing list?

Not at the moment. GitHub Discussions (if/when enabled) is the right place for open-ended questions.
