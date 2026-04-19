---
title: TUI keybindings
description: Every key the dssh TUI listens for, grouped by screen.
---

dssh's TUI is built on [Bubble Tea](https://github.com/charmbracelet/bubbletea). Keys are context-sensitive — the same key can do different things on different tabs. Below, each screen lists only the keys that apply there.

## Global

Active everywhere unless overridden by a modal.

| Key              | Action                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `Tab`            | Next tab (Connect → Create → Edit → Delete) — context-sensitive on form tabs (see below) |
| `Shift+Tab`      | Previous tab — context-sensitive on form tabs (see below)         |
| `←` / `→`        | Switch tabs — context-sensitive on form tabs (see below)          |
| `Ctrl+L`         | Toggle SQLite / ssh_config list (only in **both** mode)           |
| `Esc`            | Quit from a tab (when no filter is active)                        |
| `Ctrl+C`         | Quit immediately                                                  |

<div></div>

:::note
`q` no longer quits the TUI as of v2.1.0 — use `Esc` or `Ctrl+C`. This frees `q` to be typed into filters and form fields without ambiguity.
:::

## Connect tab

| Key                | Action                                                   |
| ------------------ | -------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter the connection list                         |
| `↑` / `↓`          | Navigate list                                            |
| `←` / `→`          | Switch tabs (cursor movement in the filter is sacrificed for tab switching) |
| `Tab` / `Shift+Tab`| Switch tabs                                              |
| `PgUp` / `PgDn`    | Page through list                                        |
| `Enter`            | Connect to the selected host                             |
| `Esc`              | Clear filter (if set), otherwise quit                    |

## Create tab

Wizard for new connections. Fields: **Name**, **User**, **Host**, **Port**, **Directory**, **ProxyJump**, and (for password auth) **Password**.

| Key                 | Action                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move between fields (up/down)                                                   |
| `↑` / `↓`           | Move between fields                                                             |
| `←` / `→`           | Toggle **Save To** (SQLite / ssh_config) when focused on it; switch tabs when the current field is empty or when focused on the Save button |
| `Ctrl+T`            | Toggle auth type: key ↔ password (disabled in ssh_config-only mode)             |
| `Enter`             | Next field / confirm Save To toggle / submit on Save button                     |
| `Esc`               | Cancel and return                                                               |

Switching to password auth while **Save To** is visible forces the target to SQLite (ssh_config entries can't hold encrypted passwords).

The **ProxyJump** field is free-text and accepts any value that `ssh -J` accepts: `user@bastion`, `bastion.example.com`, or a chain like `jump1,jump2`. Leave it empty for a direct connection.

## Edit tab

Two phases: pick a connection from the list, then edit its fields.

### List phase

| Key                 | Action                                          |
| ------------------- | ----------------------------------------------- |
| *(type to filter)*  | Fuzzy-filter                                    |
| `↑` / `↓`           | Navigate                                        |
| `←` / `→`           | Switch tabs                                     |
| `Tab` / `Shift+Tab` | Switch tabs                                     |
| `Enter`             | Open the edit form for the selected connection  |
| `Esc`               | Back / quit                                     |

### Form phase

All fields from Create are editable, including **ProxyJump**. The form is pre-filled with the connection's current values.

| Key                 | Action                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Move between fields (up/down)                                                     |
| `↑` / `↓`           | Move between fields                                                               |
| `←` / `→`           | Switch tabs when the current field is empty or when focused on the Save button    |
| `Ctrl+T`            | Toggle key ↔ password auth                                                        |
| `Enter`             | Next field / submit on Save button                                                |
| `Esc`               | Cancel and return to the list                                                     |

## Delete tab

Triple-confirm to prevent accidents.

| Key                | Action                                                               |
| ------------------ | -------------------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter                                                         |
| `↑` / `↓`          | Navigate — resets the confirmation sequence                          |
| `←` / `→`          | Switch tabs                                                          |
| `Tab` / `Shift+Tab`| Switch tabs                                                          |
| `Enter`            | Press **three times on the same item** within 1 second to delete     |
| `Esc`              | Back / quit                                                          |

Each press starts a 1-second timer. Moving the cursor, changing the filter, or letting the timer expire resets the count.

## Passphrase modal

Shown when saving your first password (2 fields) or unlocking existing passwords (1 field). Captures all input while open.

| Key                   | Action                                                        |
| --------------------- | ------------------------------------------------------------- |
| `↓` / `Tab`           | Next field, or advance to Submit                              |
| `↑` / `Shift+Tab`     | Previous field                                                |
| `Enter`               | Advance to next field, or submit when focused on Submit       |
| `Esc`                 | Cancel the modal                                              |

## Config dialog

Shown on first launch and on `dssh config`. Also captures all input.

| Key              | Action                                             |
| ---------------- | -------------------------------------------------- |
| `↑` / `↓`        | Navigate the current radio group                   |
| `Enter`          | Select the highlighted option / advance to next step |
| `Esc`            | Back one step (or cancel on the first step)        |
| `Ctrl+C`         | Cancel the whole dialog                            |
