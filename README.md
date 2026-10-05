## The scenario

You've inherited
**Taskboard**: a small internal task tracker built by an engineer who has
since left the company.

The handover notes say:

> "It's a simple Node.js app. It mostly worked, but users reported some odd
> behaviour, and honestly it wouldn't start the last time we tried. Our
> security team also had concerns but never wrote them down. Good luck!"

Your job is to get it working, make it match its spec, and flag anything that
worries you.

---

## What's in this pack

```
├── README.md          ← you are here
├── WRITEUP.md         ← template for your write-up (part of your submission)
├── app/               ← the Taskboard application (Node.js + Express)
└── logs/
    └── app-events.log ← used in Part 2
```

You'll need **Node.js 18 or newer** installed (download from
[nodejs.org](https://nodejs.org)). Everything else is up to you.

---

## Part 1: get it running and fix what you find

Get the application running locally, then use it and test it against the spec
below. There are **several deliberate faults**: some stop it starting, some
break its behaviour, and some are security problems. We won't tell you how
many. Fix what you find.

To start the app:

```bash
cd app
npm install
npm start
```

### The spec the app is supposed to meet

The previous developer left this behind. Treat it as the source of truth:

- The app listens on port **3000** by default, and the port is configurable via
  the `PORT` environment variable.
- `GET /` serves the web UI.
- `GET /health` returns `{"status":"ok"}`.
- `GET /api/todos` returns all todos as JSON, newest first.
- `POST /api/todos` with JSON body `{"text": "..."}` creates a todo and returns
  it with status `201`. A missing or empty `text` must be rejected with status
  `400` (never a `500`).
- `PUT /api/todos/:id` toggles the `completed` flag of that todo. Returns `404`
  if no todo has that id.
- `DELETE /api/todos/:id` deletes **the todo with that id**, returning `204`.
  Returns `404` if no todo has that id.
- The app must not expose secrets or internal configuration to users.

Both the API **and the web UI** should behave correctly. Try actually using the
app the way an ordinary (or a mischievous) user would.

### Tips

- Read error messages carefully. They usually tell you exactly what's wrong.
- `npm` may print useful warnings during install.
- Think like the security team: what would worry you about this code?

---

## Part 2: write a small log-analysis tool

The operations team wants a quick way to summarise log files.
`logs/app-events.log` contains lines in this format (space-separated):

```
<timestamp> <service> <LEVEL> <message...>
```

For example:

```
2026-08-10T10:02:05Z auth ERROR Connection timeout to token service
```

Write a small program that takes a **log level** and a **path to a log file**
as arguments, and prints the number of matching lines **per service** for that
level.

**Requirements:**

- Include an executable script named exactly **`analyse.sh`** at the root of
  your submission. It may be pure Bash, or it may simply call a program you
  wrote in any language you like (Python, JavaScript, Go, ...).
- It must run as: `./analyse.sh <LEVEL> <path-to-log-file>`
- Output: one line per service in the form `<service>: <count>`, sorted by
  count **descending**; break ties **alphabetically** by service name.
- Only include services with at least one matching line. If nothing matches,
  print nothing and exit successfully.
- The level match must be exact and case-sensitive (`ERROR` matches only the
  level field, not words in the message).
- Ignore blank lines and lines that don't match the format.

**Check yourself:** running `./analyse.sh ERROR logs/app-events.log` against
the provided file should print exactly:

```
auth: 4
payments: 3
api: 2
database: 1
```

We will also run your script against log files you haven't seen, so make sure
it handles the rules above rather than the specific contents of this file.

---

## Part 3: three improvements

In your write-up, tell us the **top three** things you would improve before
you would trust this app in production, and why those three.

Exactly three. Part of the exercise is deciding what matters most.

---

## Part 4: the write-up

Complete **`WRITEUP.md`** (there's a template ready for you). It should cover
what was broken, what you changed and why, your three improvements, how you
used AI tools (see below), and what you'd do next.

If you're invited to our Assessment Day, we'll ask you to talk through your
submission with an engineer, so make sure you understand and can explain
everything in it.

---

## Optional extensions

**Entirely optional. The core parts matter most.** If you have time and want
to go further, pick **at most two** of these. Depth and reasoning beat
quantity, and a half-finished extension with a good explanation of your intent
is still worth credit.

1. **Persistence**: todos vanish every time the server restarts. Its users
   won't accept that. Make the data survive a restart, using whatever storage
   approach you can justify.
2. **Tests**: add automated tests that would have caught the bugs you fixed,
   and would catch them coming back.
3. **Portability**: a teammate with a fresh laptop should be able to run the
   whole thing with one or two commands, without "works on my machine"
   surprises. (Hint: containers are one good answer, but not the only one.)
4. **Automated checks**: add a pipeline to your submission repository that
   automatically runs checks (tests, linting, security audit...) on every
   change or pull request.
5. **Observability**: an engineer woken at 2am to a "Taskboard is down"
   report needs to work out why. Improve logging and error reporting to make
   that possible.

Whatever you change: `npm install && npm start` from a clean checkout of your
submission **must still work**. If an extension needs anything extra (another
service, a different command), document it clearly in your write-up and keep a
sensible fallback.

---

## Use of AI tools

You may use documentation, search engines and AI tools (ChatGPT, Claude,
Copilot, ...) during this exercise.
