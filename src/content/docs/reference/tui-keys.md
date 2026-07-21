---
title: TUI keybindings
description: Every key the dssh TUI listens for, grouped by screen.
---

dssh's TUI is built on [Bubble Tea](https://github.com/charmbracelet/bubbletea). Keys are context-sensitive, so the same key can do different things depending on the focused pane or open dialog.

## Global

Active everywhere unless overridden by a form or dialog.

| Key                 | Action                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `Tab` / `Shift+Tab` | Switch focus between the left and right panes                         |
| `←` / `→`           | Switch top-level tabs where the focused control allows it             |
| `Ctrl+L`            | Toggle the SQLite / ssh_config source (only in **both** mode)          |
| `Esc`               | Clear the focused filter, cancel the current form, or quit             |
| `Ctrl+C`            | Quit immediately                                                       |

<div></div>

:::note
`q` no longer quits the TUI as of v2.1.0 — use `Esc` or `Ctrl+C`. This frees `q` to be typed into filters and form fields without ambiguity.
:::

## Two-pane layout

Every tab uses a fixed 50/50 split. The left pane contains connections or form fields. The right pane either filters by group or assigns groups to a connection.

A terminal size of at least `80×20` is required. Smaller terminals show a size warning instead of stacking or clipping the panes.

Search terms, cursors, the selected group, filtered connections, and pane focus persist as you move between tabs for the current TUI session.

### Filter groups

Connect, the Edit list, and Delete use the right pane as a group filter.

| Key                 | Action                                                               |
| ------------------- | -------------------------------------------------------------------- |
| *(type to filter)*  | Filter the group list by name                                        |
| `↑` / `↓`           | Select a group and filter connections immediately                    |
| `PgUp` / `PgDn`     | Page through groups                                                   |
| `Ctrl+N`            | Create a group                                                        |
| `Ctrl+R`            | Rename the selected group                                             |
| `Ctrl+D`            | Delete the selected group; its connections are kept                  |
| `Esc`               | Clear the group search, or quit when the search is empty              |

The pinned `(No Groups)` row removes the group constraint and shows all connections. It does not mean “unassigned connections.” Connection text filters and group filters are applied together.

Each group shows its assigned-connection count for the active SQLite or current `ssh_config` source. Connection text searches do not change these counts.

The selected two-line group row uses one continuous `│` marker across its name and count.

### Assign groups

Create and an active Edit form replace the filter with **Assign Groups**. A connection can belong to any number of groups.

| Key                 | Action                                                               |
| ------------------- | -------------------------------------------------------------------- |
| `↑` / `↓`           | Navigate groups                                                       |
| `PgUp` / `PgDn`     | Page through groups                                                   |
| `Space`             | Toggle the selected assignment                                       |
| `Ctrl+N`            | Create and assign a new group                                         |

Rename and delete are unavailable in assignment mode. Assignments are saved with the connection; leaving the form without saving discards the draft.

`Ctrl+S` uses the same validation, passphrase, assignment, and persistence flow as the form's Save button.

## Connect tab

| Key                | Action                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter connections by name, user, or host                         |
| `↑` / `↓`          | Navigate connections                                                     |
| `PgUp` / `PgDn`    | Page through connections                                                 |
| `Enter`            | Connect to the selected host                                             |
| `Esc`              | Clear the connection filter, or quit when the filter is empty            |

## Create tab

The left pane is a wizard with **Name**, **User**, **Host**, **Port**, **Directory**, **ProxyJump**, and, for password auth, **Password** fields.

| Key                | Action                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| `↑` / `↓`          | Move between fields                                                      |
| `←` / `→`          | Toggle **Save To** when focused; otherwise switch tabs where allowed     |
| `Ctrl+T`           | Toggle key ↔ password auth (disabled in ssh_config-only mode)            |
| `Enter`            | Advance, confirm **Save To**, or submit on the Save button                |
| `Ctrl+S`           | Validate and save from either pane                                       |
| `Esc`              | Cancel and return                                                        |

Switching to password auth while **Save To** is visible forces the target to SQLite because `ssh_config` entries cannot hold encrypted passwords.

The **ProxyJump** field accepts any value that `ssh -J` accepts: `user@bastion`, `bastion.example.com`, or a chain such as `jump1,jump2`. Leave it empty for a direct connection.

## Edit tab

Editing has two phases: select a connection, then edit its fields.

### List phase

The list uses the same connection and group filters as Connect.

| Key                | Action                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter connections                                                 |
| `↑` / `↓`          | Navigate connections                                                     |
| `PgUp` / `PgDn`    | Page through connections                                                 |
| `Enter`            | Open the selected connection                                             |
| `Esc`              | Clear the connection filter, or quit when the filter is empty            |

### Form phase

All Create fields, including **ProxyJump**, are editable. The right pane changes to **Assign Groups** with the connection's current assignments selected.

| Key                | Action                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| `↑` / `↓`          | Move between fields                                                      |
| `←` / `→`          | Switch tabs when the current field is empty or Save is focused           |
| `Ctrl+T`           | Toggle key ↔ password auth                                               |
| `Enter`            | Advance or submit on the Save button                                     |
| `Ctrl+S`           | Validate and save from either pane                                       |
| `Esc`              | Cancel and return to the list                                            |

## Delete tab

The Delete list uses the same connection and group filters as Connect, with a triple confirmation to prevent accidents.

| Key                | Action                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| *(type to filter)* | Fuzzy-filter connections                                                 |
| `↑` / `↓`          | Navigate and reset the confirmation sequence                             |
| `PgUp` / `PgDn`    | Page through connections                                                 |
| `Enter`            | Press three times on the same item within 1 second to delete             |
| `Esc`              | Clear the connection filter, or quit when the filter is empty            |

Each press starts a 1-second timer. Moving the cursor, changing either filter, changing pane focus, or letting the timer expire resets the count.

The center separator stays red. With the left pane focused, the title and selected connection use the orange warning accent. The Delete search `/` and cursor stay orange even when the right pane is focused.

## Group dialogs

Create, rename, and delete open as dialogs over the existing panes.

| Key     | Action                              |
| ------- | ----------------------------------- |
| `Enter` | Confirm the group action            |
| `Esc`   | Cancel and return to the same panes |

Deleting a group removes its assignments, never its connections.

## Passphrase dialog

Shown when saving your first password (2 fields) or unlocking existing passwords (1 field). It appears over the panes and captures all input while open.

| Key               | Action                                                  |
| ----------------- | ------------------------------------------------------- |
| `↓` / `Tab`       | Next field, or advance to Submit                        |
| `↑` / `Shift+Tab` | Previous field                                          |
| `Enter`           | Advance, or submit when focused on Submit               |
| `Esc`             | Cancel and return to the form                           |

## Config dialog

Shown on first launch and on `dssh config`. It also captures all input.

| Key        | Action                                               |
| ---------- | ---------------------------------------------------- |
| `↑` / `↓`  | Navigate the current radio group                     |
| `Enter`    | Select the highlighted option or advance             |
| `Esc`      | Go back one step, or cancel on the first step         |
| `Ctrl+C`   | Cancel the whole dialog                              |
