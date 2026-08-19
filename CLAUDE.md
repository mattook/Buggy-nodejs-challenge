# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A take-home technical challenge submission (Appvia Academy graduate challenge). It has two independent deliverables plus a write-up:

1. **`app/`** — "Taskboard", a small Node.js/Express todo-list app with deliberately introduced bugs and security issues to find and fix. `README.md` contains the full spec (the API contract the app must satisfy) under "The spec the app is supposed to meet" — treat that section as the source of truth for correct behavior.
2. **`analyse.sh` / `analyse.py`** (repo root) — a standalone log-analysis tool, unrelated to `app/`. Not a dependency of the Node app and has no build step.
3. **`WRITEUP.md`** — the submission write-up. Section 1 is a table logging every fault found/fixed (file, symptom, root cause, fix); keep it updated when fixing anything in `app/`.

## Commands

Taskboard app (run from `app/`):
```bash
cd app
npm install
npm start          # runs `node server.js`, listens on port 3000
```
There is no test suite, linter, or build step configured for `app/` (no `test`/`lint`/`build` npm scripts exist — don't assume `npm test` works).

Log-analysis tool (run from repo root):
```bash
./analyse.sh <LEVEL> <path-to-log-file>
```
`analyse.sh` is a thin Bash wrapper that execs `python3 analyse.py "$@"`; the actual logic lives in `analyse.py`. Requires `python3` on PATH. Sample input at `logs/app-events.log`.

## Architecture

### Taskboard (`app/`)

- Single-file Express server: `app/server.js`. All routes, in-memory data, and startup logic live there — no router/controller/model split.
- `todos` is a plain in-memory array (`let todos = [...]`), reset on every restart. There is no database or persistence layer.
- Static frontend served from `app/public/` (`index.html`, `app.js`, `style.css`) via `express.static`; the frontend talks to the API with relative `fetch()` calls (`/api/todos`, etc.), so it's agnostic to which port the server runs on.
- Config/secrets: `app/.env` (git-ignored) holds `ADMIN_TOKEN`, loaded via `dotenv` at the top of `server.js`. `app/.env.example` is the committed template — copy it to `app/.env` and set a real value before exercising `POST /api/admin/reset`. The admin-reset route fails closed (`403`) if `ADMIN_TOKEN` is unset, so a missing `.env` doesn't silently disable auth.
- `PORT` is currently a hardcoded constant in `server.js` (not yet read from `process.env.PORT`), even though the README spec says it should be configurable via the `PORT` env var — a known open gap, tracked in `WRITEUP.md`, not yet fixed.

### Log-analysis tool (repo root)

- `analyse.py` parses lines shaped `<timestamp> <service> <LEVEL> <message...>` (space-separated, split with `maxsplit=3` so multi-word messages stay intact), filters by an exact case-sensitive level match, counts matches per service, and prints `service: count` sorted by count descending then service name ascending. Blank lines and lines with fewer than 4 fields are silently skipped.
- Exit code is `0` even when nothing matches (prints nothing); exit `1` on bad args or an unreadable file, with a message to stderr.

## Repo hygiene notes

- `app/node_modules/` is currently tracked in git (from the original handover commit) even though `.gitignore` now excludes `node_modules/` going forward — untracking it would require an explicit `git rm -r --cached app/node_modules`, not yet done.
- `.gitignore` (repo root) covers `node_modules/`, `.env`, and `.env.local`.
