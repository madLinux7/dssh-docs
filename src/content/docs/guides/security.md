---
title: Security model
description: How dssh encrypts passwords, what it doesn't protect, and why key auth is still the preferred option.
---

dssh is designed to be boring about crypto: well-vetted primitives, conservative defaults, no clever home-grown constructions. This page lays out what is and isn't protected, so you can decide where it fits in your threat model.

## TL;DR

- Passwords at rest: **AES-256-GCM**, key derived via **Argon2id** from a master passphrase you never store.
- Connection metadata (name, user, host, port, directory) is **not** encrypted — it sits in plain SQLite.
- The master passphrase is not stored, not recoverable, and not derivable from anything on disk. Lose it and those passwords are gone.
- Key-based auth skips all of the above — nothing sensitive is stored, and dssh `exec`s straight into `ssh`.

## What gets encrypted

| Data                         | Encrypted?        | Where                         |
| ---------------------------- | ----------------- | ----------------------------- |
| SSH passwords                | **Yes** (AES-GCM) | `connections.encrypted_pass`  |
| Per-password GCM nonce       | n/a (stored plain, non-secret) | `connections.pass_nonce` |
| Passphrase verification token | **Yes** (AES-GCM) | `settings.passphrase_check`  |
| Connection name / user / host / port / dir | No   | `connections.*`              |
| Identity-file path           | No                | `connections.identity_file`   |
| Argon2id salt                | No (non-secret)   | `settings.argon2_salt`        |

Metadata is intentionally plain: dssh needs to list and fuzzy-filter connections without asking for a passphrase every time. If that doesn't match your threat model, use key auth only and let dssh store nothing sensitive.

## Crypto flow

```
┌──────────────────┐                           ┌────────────────────────┐
│ Master passphrase│                           │ settings.argon2_salt   │
│ (you, each time) │                           │  (16 random bytes,     │
└──────┬───────────┘                           │   generated once)      │
       │                                       └─────────┬──────────────┘
       │         ┌─────────────────────────┐             │
       └────────►│  Argon2id               │◄────────────┘
                 │  time=1, mem=64 KiB,    │
                 │  lanes=4, keyLen=32     │
                 └──────────┬──────────────┘
                            │  256-bit key (never persisted)
                            ▼
                 ┌──────────────────────────┐
                 │  AES-256-GCM             │
                 │  random 12-byte nonce    │
                 │  per encryption          │
                 └──────────┬───────────────┘
                            │
            ┌───────────────┴──────────────────┐
            ▼                                   ▼
   ciphertext (stored in DB)           nonce (stored in DB)
```

### Passphrase verification

On first password save, dssh encrypts the literal string `"dssh-verify"` with the derived key and stores the ciphertext + nonce in `settings.passphrase_check`. On every later unlock, it decrypts that token with the passphrase you just typed and checks the plaintext. Wrong passphrase → GCM authentication fails → dssh rejects the input. The passphrase itself is never written anywhere.

## Why these primitives

- **AES-256-GCM** — AEAD (authenticated encryption), detects tampering, widely audited, hardware-accelerated on modern CPUs.
- **Argon2id** — winner of the Password Hashing Competition, resists GPU and ASIC brute force better than PBKDF2 or bcrypt.
- **12-byte random nonce per encryption** — GCM's nonce size sweet spot. Random nonces are safe in the quantity this tool produces.

Parameters (`time=1, mem=64KiB, lanes=4`) are conservative and tuned for a snappy unlock on modest hardware. They're stricter than what bcrypt gives you and fine for the actual threat here (local attacker with disk access trying to brute-force your passphrase).

## Threat model

### Protects against

- **Offline disk access**: someone copies `~/.dssh/dssh.db`. Without the passphrase, Argon2id makes brute-forcing slow and per-guess expensive; every stored password is protected by the same derived key but via distinct GCM nonces, so there's no ciphertext-reuse leverage.
- **Accidental leaks** (backups, cloud sync, screen sharing): passwords are never visible in list output or SQL queries.
- **Tampering**: GCM's auth tag detects modification of either ciphertext or nonce.

### Does **not** protect against

- **A passphrase you use elsewhere** — if it's in a breach dump, everything falls. Pick something unique.
- **Active malware on your machine** — a keylogger or memory reader can grab the passphrase or the derived key during the brief window it exists in process memory.
- **Someone watching over your shoulder while you type the passphrase** — same as any password prompt.
- **Metadata analysis** — host names, user names, and ports are readable by anyone who can read the SQLite file.
- **Shoulder-surfing `dssh ls`** — the list prints plaintext metadata by design.

## Key vs password auth — which to use

Use key auth whenever the remote lets you. Reasons, in order:

1. **Nothing sensitive at rest.** dssh stores an identity-file path and nothing else. No passphrase, no ciphertext, no derived key ever touches the DB.
2. **Lower latency.** Key auth uses `syscall.Exec` on Unix — dssh is literally replaced by `ssh` in the same process. Password auth spawns `ssh` as a child and hands it the password via `SSH_ASKPASS`.
3. **Standard ecosystem.** Key auth works with `ssh-agent`, YubiKey / hardware keys, `ProxyJump`, and every remote host. Password auth is limited to hosts that accept `PreferredAuthentications=password`.
4. **No rotating shared secret.** If the team rotates the password on a shared box, everyone with a saved copy drifts out of sync. Keys don't have that failure mode.

Reach for password auth when you genuinely need it — legacy appliances, emergency recovery accounts, or your ISP's router. Then rotate to keys as soon as you can.

## Operational notes

- **Backups**: back up `~/.dssh/dssh.db` like any other secret. It's no worse than a password manager vault but no better either.
- **Sync**: the database is portable across machines (see [Migration](/guides/migration/)). Anywhere you put it, it remains passphrase-protected for the encrypted fields — but metadata travels in the clear.
- **Rotation**: to change the passphrase, `dssh reset` + re-add password-auth hosts. There is no built-in re-encrypt-in-place today. For key-only users, rotation is a no-op.
- **Askpass script lifetime**: on password connects, the askpass script is written to `$TMPDIR` with mode `0700`, points at a short-lived `printf` that emits the password once, and is removed via `defer` when the `ssh` child exits. On abnormal termination (kernel panic, power loss) the file may survive until the next `$TMPDIR` cleanup.

## Reporting security issues

If you find something that looks like a vulnerability, please don't open a public issue — use the GitHub [Security advisory](https://github.com/madLinux7/dssh/security/advisories/new) flow on the repository, or reach out to the maintainer directly.
