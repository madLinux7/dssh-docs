---
title: TUI keybindings
description: Every key the dssh TUI listens for, grouped by screen.
---

dssh's TUI is built on [Bubble Tea](https://github.com/charmbracelet/bubbletea). Keys are context-sensitive — the same key can do different things on different tabs. Below, each screen lists only the keys that apply there.

## Global

Active everywhere unless overridden by a modal.

| Key              | Action                                                            |
| ---------------- | ----------------------------------------------------------------- |
| `Tab`            | Next tab (Connect → Create → Edit → Delete)                       |
| `Shift+Tab`      | Previous tab                                                      |
| `Ctrl+L`         | Toggle SQLite / ssh_config list (only in **both** mode)           |
| `Ctrl+C`         | Quit immediately                                                  |
| `Esc` / `q`      | Quit from a tab (when no filter is active)                        |

<div></div>

:::note
`q` only quits when the filter box is empty. While you're typing a filter, `q` goes into the text.
:::

## Connect tab

| Key              | Action                                                   |
| ---------------- | -------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter the connection list                       |
| `↑` / `↓`        | Navigate list                                            |
| `PgUp` / `PgDn`  | Page through list                                        |
| `Enter`          | Connect to the selected host                             |
| `Esc`            | Clear filter (if set), otherwise quit                    |

## Create tab

Wizard for new connections.

| Key               | Action                                                       |
| ----------------- | ------------------------------------------------------------ |
| `↑` / `↓`         | Move between fields                                          |
| `←` / `→`         | Toggle **Save To** (SQLite / ssh_config) when focused on it  |
| `Ctrl+T`          | Toggle auth type: key ↔ password (disabled in ssh_config-only mode) |
| `Enter`           | Next field / confirm Save To toggle / submit on Save button  |
| `Esc`             | Cancel and return                                            |

Switching to password auth while **Save To** is visible forces the target to SQLite (ssh_config entries can't hold encrypted passwords).

## Edit tab

Two phases: pick a connection from the list, then edit its fields.

### List phase

| Key                | Action                                          |
| ------------------ | ----------------------------------------------- |
| *(type to filter)* | Fuzzy-filter                                    |
| `↑` / `↓`          | Navigate                                        |
| `Enter`            | Open the edit form for the selected connection  |
| `Esc` / `q`        | Back / quit                                     |

### Form phase

| Key          | Action                                      |
| ------------ | ------------------------------------------- |
| `↑` / `↓`    | Move between fields                         |
| `Ctrl+T`     | Toggle key ↔ password auth                  |
| `Enter`      | Next field / submit on Save button          |
| `Esc`        | Cancel and return to the list               |

## Delete tab

Triple-confirm to prevent accidents.

| Key                | Action                                                               |
| ------------------ | -------------------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter                                                         |
| `↑` / `↓`          | Navigate — resets the confirmation sequence                          |
| `Enter`            | Press **three times on the same item** within 1 second to delete     |
| `Esc` / `q`        | Back / quit                                                          |

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
| `Ctrl+C` / `q`   | Cancel the whole dialog                            |
