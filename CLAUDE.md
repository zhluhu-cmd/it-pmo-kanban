# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file IT PMO Kanban board demo (fictitious bank, internal training tool): `index.html` contains all markup, CSS and JS. There is no build, lint, or test tooling and no package manager. Run it by opening `index.html` in a browser (`open index.html` on macOS). A quick JS syntax check: extract the `<script>` body to a temp file and run `node --check` on it.

## Hard constraints (from the original brief)

- Vanilla HTML/CSS/JS only: no frameworks, bundlers, npm, CDN scripts, web fonts, or image files. System font stack; inline SVG/Unicode for icons.
- Must work via `file://` (double-click), no server.
- No persistence of any kind: no localStorage, sessionStorage, IndexedDB, cookies. Refresh resets to seed data by design (the UI says so).
- Only network call is FormSubmit's AJAX endpoint (`FORMSUBMIT_ENDPOINT`, top of the script). The notification email address must appear only there.
- No `!important`, no `alert()`/`confirm()` (delete confirmation and validation errors are inline).
- No real bank logo/branding; wordmark is the neutral text "IT PMO". The `UOB-ITPM-####` ID format and `[UOB IT PMO]` email subject are user-specified strings; keep them.

## Architecture

State flows one way: `state = { tasks, filters }` (plus a separate `ui` object for transient things like the open Move menu, pending delete, drag id, ID counter) → `renderBoard()` → DOM.

- `renderBoard()` is the only place card/column DOM is written (via `innerHTML` of template strings from `renderCard()`); it also calls `renderSummary()` (header stats, computed from all tasks) while column counts reflect the filtered view. Mutators (`addTask`, `moveTask`, `deleteTask`, filter handlers) change state and then call `renderBoard()`; never patch card DOM directly.
- Because the board is rebuilt on every change, event handling is delegated on `#board` (clicks via `data-action`/`data-id`, plus native HTML5 drag events), and keyboard focus is restored explicitly (`ui.focusCardId`, `focusControl()`) after re-renders.
- All user-supplied text must go through `escapeHtml()` before entering an HTML string. Toasts use `textContent`.
- Add-task flow (`handleSubmit`): validate → `addTask` (optimistic) → reset form → success toast → `notifyNewTask()` in try/catch; failure only produces a warning toast. The modal stays open with the button in a "Sending…" state until the request settles, then closes.
- Overdue is derived (`isOverdue`: due date before today and status ≠ Done), never stored. Seed due dates are computed relative to today so overdue examples stay valid.
- Fixed lists (`STATUSES`, `PROJECTS`, `CATEGORIES`, `PRIORITIES`) drive both the selects and the columns; change them there.
