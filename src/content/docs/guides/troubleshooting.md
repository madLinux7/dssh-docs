---
title: Troubleshooting
description: Common dssh problems, what's actually happening, and how to fix them.
---

Most dssh problems are actually `ssh` problems wearing a costume. The `--` flag is your best friend — it forwards anything to the underlying `ssh` call, including `-v` for verbose output.

## First aid: debug any connection

```sh
dssh myserver -- -vvv
```

Triple `-v` shows the full SSH handshake, authentication steps, and server responses. Read the first failure line, not the last — downstream errors often cascade from one earlier problem.

## "ssh not found in PATH"

```text
Error: ssh not found in PATH: exec: "ssh": executable file not found in $PATH
```

dssh calls your system `ssh` binary. It doesn't ship its own.

- **Linux/macOS**: install `openssh-client` via your package manager.
- **Windows 10+**: enable the **OpenSSH Client** optional feature (Settings → Apps → Optional features) or install Git Bash, which bundles OpenSSH.
- **WSL**: install via the distro package manager (`sudo apt install openssh-client`). dssh running inside WSL uses the Linux ssh, not the Windows one.

## "Permission denied (publickey)"

The most common failure. Work through these in order:

1. **Is the right key being offered?**
   ```sh
   dssh myserver -- -v 2>&1 | grep -i 'offering\|identity'
   ```
   If nothing is offered, your agent isn't loaded or the key file is in a non-default location. Edit the connection (`dssh edit`) and set the identity file explicitly.

2. **Are key permissions sane?** OpenSSH refuses to use keys that are world-readable:
   ```sh
   chmod 600 ~/.ssh/id_ed25519
   chmod 700 ~/.ssh
   ```

3. **Does the public key exist in the remote `~/.ssh/authorized_keys`?**
   ```sh
   ssh-copy-id user@host
   ```
   Then try `dssh myserver` again.

4. **Is ssh-agent running and loaded?**
   ```sh
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

## "Permission denied (password)" on a password-auth host

- The password in dssh is out of date. Rotate it: `dssh edit` → switch to that host → update the password field. You'll be asked for the master passphrase once to decrypt/re-encrypt.
- Remote SSH config disallows password auth (`PasswordAuthentication no` in `sshd_config`). Either use key auth or enable passwords on the server side.

## Lost master passphrase

There is no recovery path. Argon2id is designed to make that impossible.

**Your options:**

1. **Reset everything** (nuclear): `dssh reset`. This deletes `~/.dssh/dssh.db` after two confirmations. `ssh_config` entries survive. Key-only connections are trivially re-added.
2. **Keep the DB, re-add only password hosts**: same as (1) — there is currently no way to partially reset.
3. **Switch the host to key auth**, which you were probably going to do anyway.

If you haven't lost it but want to *change* it, the simplest path today is the same as (1).

## "Connection refused"

This is purely an `ssh` error — dssh has already handed off control.

- Wrong port. Check with `dssh ls`; edit with `dssh edit`.
- Host unreachable (firewall, VPN not up, NAT). `ping` the host first, then `nc -zv host port`.
- `sshd` not running on the remote. On the remote: `systemctl status sshd`.

## "invalid target: target must be user@host or ssh://user@host:port"

`dssh add` got a target it couldn't parse. Accepted forms:

```sh
dssh add myhost user@host           # bare
dssh add myhost ssh://user@host     # URI
dssh add myhost ssh://user@host:22  # URI with port
```

No form without a user (`@`-less) is accepted — dssh refuses to guess.

## "name is a reserved command"

You tried to save a connection named `add`, `rm`, `list`, `ls`, `new`, `create`, `edit`, `delete`, `reset`, `help`, or `config`. Pick a different name — those collide with CLI subcommands.

## "connection already exists in ssh_config" / "in SQLite" (both mode)

You're in `both` mode and the same name lives in the other store. dssh refuses to silently shadow. Either delete the existing entry or save under a different name. If the duplicate is intentional, the `add` command offers to proceed anyway via a `Yes / Abort` radio prompt.

## Master passphrase prompt keeps appearing

Each `dssh` invocation is a fresh process — the derived key lives only in memory. There is no key cache on disk, by design. If the prompts are disruptive, move to key auth for the affected hosts.

## TUI looks garbled / colors wrong

- Your terminal needs Unicode + TrueColor. Most modern terminals qualify; minimal ones (tmux without TrueColor, Windows 7 console) may not.
- If colors are off but glyphs are fine, check `$TERM` — should be something like `xterm-256color` or `tmux-256color`.
- Inside `tmux`: enable TrueColor with `set -ga terminal-overrides ",xterm-256color:Tc"` in your tmux config.

## WSL quirks

- **Password connects via the Windows ssh, not WSL's**: make sure you installed `openssh-client` inside the WSL distro. Confirm with `which ssh` — should be `/usr/bin/ssh`, not a Windows path.
- **SSH_ASKPASS in WSL**: dssh strips `DISPLAY` and forces `SSH_ASKPASS_REQUIRE=force`, so even without an X server it works. If you see a dialog box pop up anyway, something else in your environment is setting `SSH_ASKPASS` — `env | grep -i askpass` to track it down.
- **Identity files**: if your keys live in the Windows side (`/mnt/c/Users/...`), file permissions over the 9p bridge are always `0777`, which OpenSSH rejects. Copy the key into the WSL home and `chmod 600` it.

## ssh_config destination file: permission denied

`dssh config` accepts any path, but the directory needs to exist and be writable. For `~/.ssh/config.d/dssh`:

```sh
mkdir -p ~/.ssh/config.d
chmod 700 ~/.ssh ~/.ssh/config.d
```

Then add to `~/.ssh/config`:

```text
Include ~/.ssh/config.d/dssh
```

Otherwise your main ssh won't read the directive file, even though dssh writes to it.

## Still stuck?

Open an issue with:

- `dssh --version`
- OS and terminal (`uname -a`, terminal name)
- The command you ran and the full output of `dssh <cmd> -- -vvv` when relevant
- What you expected vs. what happened

[github.com/madLinux7/dssh/issues](https://github.com/madLinux7/dssh/issues)
