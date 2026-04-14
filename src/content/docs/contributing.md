---
title: Contributing
description: How to set up a dev environment, run tests, and open a PR for dssh.
---

dssh is a small, focused project — the kind where a single well-scoped PR can meaningfully move the needle. This page walks through the dev loop.

## Where things live

```
dssh/
├── cmd/dssh/           # main.go — wires version into cli.Execute
├── internal/
│   ├── cli/            # Cobra commands: add, rm, list, create, edit, delete, config, reset, root
│   ├── crypto/         # AES-256-GCM + Argon2id
│   ├── db/             # modernc.org/sqlite layer
│   ├── model/          # Connection, AuthType, RuntimeConfig, ValidateName
│   ├── ssh/            # exec_unix.go, exec_windows.go, askpass script
│   ├── sshconfig/      # reader / writer for ~/.ssh/config entries
│   └── tui/            # Bubble Tea app: tabs, modals, theme
├── install.sh / install.ps1
├── Makefile
└── README.md
```

High-level dependency flow: `cmd → cli → (tui, ssh, db, sshconfig) → (crypto, model)`. Keep new code respecting that direction — TUI and DB shouldn't reach into each other.

## Dev setup

Requires **Go 1.26+**.

```sh
git clone https://github.com/madLinux7/dssh.git
cd dssh
go mod download
```

Build and test:

```sh
make build       # static CGO-free binary, stripped ldflags
make test        # go test ./...
make release     # build + UPX compress
make clean       # remove binary artifacts
```

`make release` requires `upx` in `PATH`. If you don't have it, `make build` is enough for local work.

The binary lands in the repo root as `./dssh`. Run `./dssh --version` to verify the build embedded the git-describe tag via ldflags.

## Running tests

```sh
go test ./...
```

Tests live alongside the code in each package (`crypto_test.go`, `model_test.go`, `sshconfig/read_test.go`, `sshconfig/write_test.go`). New logic that touches crypto or ssh_config parsing should ship with coverage — those two areas are where subtle regressions hurt most.

## Trying changes locally

Because the data dir is `~/.dssh`, it's easy to trash your real connections during dev. Isolate with a throwaway `$HOME`:

```sh
mkdir -p /tmp/dssh-dev
HOME=/tmp/dssh-dev ./dssh config
HOME=/tmp/dssh-dev ./dssh add test root@localhost
HOME=/tmp/dssh-dev ./dssh ls
```

When you're done, `rm -rf /tmp/dssh-dev`.

## Code conventions

- **Keep packages thin.** If a new feature needs to cross two layers, add a function at the right layer instead of reaching through.
- **Errors are values.** Wrap with `fmt.Errorf("... %w", err)` when propagating; return sentinel errors where callers branch on them (see `sshconfig.ErrNotFound`).
- **No third-party TUI components.** The existing Charm stack (Bubble Tea / Bubbles / Lip Gloss) is sufficient — avoid adding new UI deps without a strong reason.
- **Comments**: explain *why*, not *what*. Cross-platform quirks, security-relevant defaults, and non-obvious ordering deserve a line. Straightforward code does not.
- **No breaking changes to `~/.dssh/dssh.db`** without a migration. Users upgrade dssh; their data needs to survive.

## Opening a PR

1. **Fork and branch.** One feature per branch, descriptive name.
2. **Run `go fmt ./...` and `go vet ./...`** before committing.
3. **Add or update tests** for behaviour changes. Docs PRs can skip this.
4. **Keep the diff small.** Refactors bundled into feature PRs are harder to review — if you spot cleanup while working, consider a separate PR.
5. **Describe the *why* in the PR body.** "Adds feature X" is less useful than "Users hit friction when X because Y; this adds X to remove that friction."
6. **Link any related issue.**

CI (if configured on the repository) runs `go test ./...` across platforms. Make sure it's green before requesting review.

## Reporting bugs

Before opening a bug:

- Upgrade to the latest release (`dssh --version`).
- Reproduce with a clean data dir (`HOME=/tmp/test ./dssh ...`) — eliminates local-state oddities.
- Capture `dssh <cmd> -- -vvv` output if the bug involves an ssh connection.

Then file at [github.com/madLinux7/dssh/issues](https://github.com/madLinux7/dssh/issues) with:

- `dssh --version`
- OS / terminal / shell
- Minimal steps to reproduce
- Expected vs. actual

## Feature requests

Feature requests are welcome — but dssh has a small-surface philosophy. Before filing, consider:

- Can this be done with `-- <ssh flags>` forwarding?
- Does the functionality belong in `ssh_config` instead?
- Is it inside the "manage SSH connections" scope, or expanding outward (key gen, agent management, network diagnostics, …)?

Out-of-scope features won't get an automatic "no" — but they'll take a stronger case.

## Security disclosures

Don't file security issues in the public tracker. Use GitHub's [Security advisory](https://github.com/madLinux7/dssh/security/advisories/new) flow on the repository. See [Security model → Reporting](/guides/security/#reporting-security-issues).

## Acknowledgements

dssh stands on the shoulders of great open source:

- [Bubble Tea](https://github.com/charmbracelet/bubbletea), [Bubbles](https://github.com/charmbracelet/bubbles), [Lip Gloss](https://github.com/charmbracelet/lipgloss) — Charm's TUI stack
- [Cobra](https://github.com/spf13/cobra) — CLI framework
- [modernc.org/sqlite](https://gitlab.com/cznic/sqlite) — pure-Go SQLite
- [golang.org/x/crypto](https://pkg.go.dev/golang.org/x/crypto) — Argon2id
- [UPX](https://upx.github.io/) — binary compression
