# Write-up: [your name]

> Fill in each section below. Bullet points are fine. Clarity beats length.
> If you're invited to the Assessment Day you'll talk an engineer through this
> document, so write it as something you'd be happy to present.

## 1. What was broken

List each fault you found and fixed. For each one: where it was, what the
symptom was, what the root cause was, and what you changed.

| # | Where (file) | Symptom | Root cause | My fix |
|---|--------------|---------|------------|--------|
| 1 |       package.json       |    `npm install` flagged 1 high severity vulnerability in lodash     |      package.json specified an outdated version of lodash with security risks      |   Updated to `lodash@^4.18.1` via `npm install lodash@^4.18.1` and confirmed clean with `npm audit`    |
| 2 |      package.json        |    `npm start` failed because it couldn't find index.js     |      the script pointed to `index.js` but the actual entry file in the project was `server.js`      |    Updated `scripts.start` in package.json to run `node server.js`    |
| 3 |      package.json        |    `npm start` raised `Error: Cannot find module 'morgan'`     |      `server.js` line 2 requires `morgan`, but it was never listed in dependencies, so `npm install` didn't fetch it      |    Ran `npm install morgan`, so the logger the app actually uses is now installed    |
| 4 |      server.js        |    App started with no errors, but `curl localhost:3000/health` returned nothing     |      Line 8 was `const PORT = 300`: the server was actually listening on 300, not 3000.      |    Changed `const PORT = 300` to `const PORT = 3000`. `curl localhost:3000/health` now returns `{"status":"ok"}`, and `curl localhost:300/health` returns nothing. I will now switch to using postman.    |
| 5 |      server.js        |    `POST /api/todos` returned `500` instead of `400` for a missing/empty `text` — e.g. no body at all, `{}`, `{"text":""}`, or a non-string `text` like `{"text":123}` all crashed the process with a TypeError.      |      Line 32 did `req.body.text.trim()` with two assumptions: `req.body` exists and has a text property; that text property is a string. If text was sent as a number, null, without a JSON body or missing entirely, calling `.trim()` throws a server-side `500` error. Whitespace-only text (`"   "`) also slipped through as "valid" since it was never re-checked after trimming      |    Changed line 32 to `const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''`, then added a guard: `if (!text) return res.status(400).json({ error: 'text is required' })` before the todo is posted.    |
| 6 |      server.js        |    `PUT /api/todos/:id` always returned `404`, even for todo ids that existed      |      Line 47 had `t.id === req.params.id`. Express path params are always strings, but `t.id` is a number so `.find()` never matched anything, regardless of whether the id existed      |    Changed to convert the param first: `const id = Number(req.params.id); const todo = todos.find((t) => t.id === id)`. A non-numeric id (e.g. `/api/todos/abc`) becomes `NaN`, which correctly matches nothing and still returns `404` rather than throwing. Verified with postman: toggling an existing id now returns `200` and flips `completed`, a non-existent numeric id returns `404`, and a malformed id returns `404` with no crash    |
| 7 |      server.js        |    `DELETE /api/todos/:id` always returned `204` even for ids that didn't exist because it was deleting whatever was at position 1 rather than id 1      |      Line 57 did `todos.splice(req.params.id, 1)`. `req.params.id` is the todo's *id*, but `splice`'s first argument is an array *index*. Nothing ever looked up which array slot actually held that id, and `splice` on an out-of-range index still returns success as it's just a `pass`, so a delete of a non-existent id reported `204` instead of the `404`      |    Rewrote to find the real index first: `const id = Number(req.params.id); const index = todos.findIndex((t) => t.id === id); if (index === -1) return res.status(404).json(...); todos.splice(index, 1)`. I verified the behaviour specified on the task with postman    |
| 8 |      server.js        |    `GET /api/debug` returned the full `process.env` object to anyone, so every environment variable, potentially including secrets, was visible.      |      Line 65 (`env: process.env`) included the entire environment in the JSON response      |    Removed the `env` field from the response, keeping only the non-sensitive fields the endpoint otherwise reports. Verified with postman    |
| 9 |      server.js        |    `ADMIN_TOKEN` was a secret hardcoded in server.js and committed to git, so anyone with repo access or git history has the token forever, meaning a fix requires a redeploy rather than a config change      |      Line 9 hardcoded the real token in the source (`const ADMIN_TOKEN = 'appvia-admin-8f3kd92';`). Also, if `ADMIN_TOKEN` was ever missing, the check on line 71 would accidentally let requests through instead of blocking them (fail open bug) | Changed and moved the token out of the code into an example environment variable (`process.env.ADMIN_TOKEN`), and changed the check so a missing token blocks access instead of allowing it. Tested with curl: no token set → blocked (even with a header trying to fake it); correct token set → admin action works as expected. Note: the original token is compromised in git history    |
| 10 |      server.js        |    Even after row 9's fix, running the app still meant manually exporting `ADMIN_TOKEN` in the shell every time (`ADMIN_TOKEN=... npm start`)      |      No `.env` support existed and only an example env and token was sent through to github    |    Installed `dotenv`, added `require('dotenv').config()` as the first line of server.js and put the token in `app/.env`. I also created a root `.gitignore` covering `node_modules/`, `.env`, and `.env.local` so the real secret and dependency tree can never be committed by accident. Verified that only real `x-admin-token` returns a success on postman    |

## 2. Security concerns

Which of the issues above (or anything else you spotted) were security
problems? Why do they matter, and what could someone actually do with them?

1. **| 1 |** Outdated lodash version had several known security holes. This matters because this isnt a bug we can fix ourselves so it is important to be on the newest version of lodash. The old one exposed our app to Javascript property injections and ReDoS which could corrupt app-wide logic or freeze the server.
2. **| 8 |** private URLs and credentials may be stored in `process.env` and anyone could hit `GET api/debug` and read all of it to temper with data or funds.
3. **| 9 |** There are 2 problems from hard-coding the admin token: the token is permanently in git history - so anybody with repo access can get admin privileges even if you delete it; a separate line has a fail open bug which lets somebody type "undefined" to get admin privileges.

## 3. How to run my submission

- App:
  1. `cd app && npm install`
  2. Create and set `ADMIN_TOKEN=appvia-admin-8f3kd92` on `app/.env`.
  3. `npm start` — the app listens on port 3000 (`http://localhost:3000`).
- Log tool: 
  1. Make the script executable from the root (one-time setup): `chmod +x analyse.sh`
  2. Run as `./analyse.sh <LEVEL> <path-to-log-file>`
- Anything else an engineer needs to know to run or test my work:
  - `POST /api/admin/reset` requires the header `x-admin-token: <value of
    ADMIN_TOKEN from your .env>`; any other value (or no header) returns `403`.
  - `.env` is git-ignored on purpose — it holds the real admin token and is
    never committed.

## 4. My top three production improvements

Exactly three, in priority order, with your reasoning for both the choice and
the order.

1. The app should save tasks between restarts so that users dont lose all their changes after maintenance or crashes. The entire purpose of the app is "track my tasks" so this is the most important improvement.
2. There should be a cap on requests so that users cant flood the api and degrade the app or make it crash. This is the most important security update because it is the easiest to exploit.
3. Automated tests (CI gate) must be implemented to keep bugs squashed. It would save many hours of human review, and developers could confidently work on the app because they'd be alerted of any issues on every PR. The app would still be completely functional without this improvement, which is why 1 and 2 take priority.

## 5. Optional extensions (if attempted)

Which did you pick, why, how far did you get, and what would you finish with
more time?

## 6. How I used AI tools

Which tools (if any), what you used them for, where they helped, and where
they were wrong or you overrode them. Honesty here is a positive signal.

I used claude code integrated into vscode to write code and table entries in part 1. I did one 'task' at a time, so that in between them I could consolidate my understanding by checking the code; rewriting the entry in simpler terms; and verifing API hits with postman. Additionally, claude's fix for entry 9 felt rough since it did not actually install and use dotenv, so I loaded an env file into the app myself and put the original token inside of it.

I also used claude code to write up the analyse tool in bash and python. I then added comments and type hints to make sure the code was clean and understandable.

## 7. Reflections

- The hardest part of this exercise was:
- One thing I learned doing it:
- If I had another day, I would:
