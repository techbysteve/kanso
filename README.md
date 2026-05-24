# Kanso

You might be wondering, why build another reading list app when Daily.dev
already has bookmarks? Fair question. The problem is not bookmarking. The
problem is the slow, quiet pile-up afterward: everything looked worth saving at
the time, and then the backlog became too large to trust.

Kanso is my attempt to turn that backlog into a decision loop. One bookmark at a
time, one small choice at a time: read soon, defer, skip, or clear it out.

## Getting Used to the Mental Model

The main idea is borrowed from an anti-library rather than a dashboard. Your
saved articles are not treated as a collection to admire. They are treated as a
queue to process.

So instead of opening the app and staring at yet another wall of cards, the
triage screen shows one bookmark at a time. Kanso scores it, explains the score,
and gives you four fast decisions:

```text
S       move to Shortlist
L       move to Later
D       clear out the bookmark
Space   skip for now
Z       undo the last action
```

That tiny loop is the whole bet. If a user can process 20 bookmarks in a few
minutes, the app is doing its job.

## Daily.dev Integration

Kanso uses the Daily.dev Public API. On the landing screen, paste your personal
Daily.dev API key and the app stores it in the browser so server actions can
fetch your unread bookmarks.

Plus users get real Daily.dev bookmark lists for:

- `Shortlist`
- `Later`
- `Read`

Free users can still use the triage flow. Since Daily.dev bookmark lists are a
Plus feature, Kanso simulates Shortlist and Later locally in the browser.

## The Scoring Engine

Now here is where a simple bookmark app gets more interesting. Every bookmark
gets a priority score from 0 to 100, using a weighted mix of:

- Upvotes
- Recency
- Read time fit
- Tag affinity across your current backlog

The default weighting is intentionally opinionated:

```ts
upvotes: 40
recency: 25
readTime: 20
tagAffinity: 15
```

The score is not meant to be magic. It is meant to be explainable. A card should
say why it looks worth reading, whether that is strong engagement, a short read,
freshness, or a match with tags you keep saving.

If the defaults do not match how you read, open settings and rebalance the
weights. Kanso normalizes the values, so the sliders can drift without breaking
the formula.

## Navigation and Lists

There are a few views for different moods:

- `/inbox` shows unread bookmarks with sorting and filters.
- `/triage` is the one-card decision loop.
- `/shortlist` holds the articles you actually intend to read.
- `/later` is the guilt-free holding zone.

The Shortlist is deliberately treated as something that should stay small. Once
it grows past 10 items, the UI starts nudging you to move things to Later, mark
them as read, or clear them out.

## AI Inspiration

Kanso can also turn shortlisted articles into small project ideas. Add a Groq
API key in settings, then use the Inspire action from Shortlist. The app sends a
small article summary to Groq and asks for one buildable software idea with an
MVP, stack, timing rationale, and article connections.

If no Groq key is configured, the core bookmark triage workflow still works.

## Running the App

This project uses Bun because the repository includes `bun.lock`.

```bash
bun install
bun run dev
```

Then open:

```text
http://localhost:3000
```

For production checks:

```bash
bun run lint
bun run typecheck
bun run build
```

## Project Shape

This is a small Next.js App Router app.

- `app/` contains routes and layouts.
- `components/` contains reusable UI and feature components.
- `components/ui/` contains shadcn/ui primitives.
- `lib/` contains Daily.dev API access, server actions, scoring, and helpers.
- `hooks/` contains Zustand stores for settings, scoring, and local triage data.
- `DESIGN.md` and `PLAN.md` capture the product direction and design system.

## Environment Notes

Daily.dev credentials are entered through the app and stored in browser-backed
settings/cookies. For AI project ideas, either add a Groq key in settings or set
one in `.env.local`:

```bash
GROQ_API_KEY=your_groq_key
```