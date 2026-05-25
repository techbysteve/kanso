# Daily.dev Bookmark Triage — The Anti-Library App

## Product Summary

Daily.dev users often save aggressively and read selectively. A bookmark gets added with good intent, then disappears into a growing backlog. This product turns that backlog into a lightweight decision system: decide what is worth reading, promote the best items, defer uncertain items, and clear stale saves without guilt.

The product is inspired by the Readwise Reader philosophy, but adapted specifically for Daily.dev bookmarks and Daily.dev’s API model.

## Product Thesis

The core problem is not that users need more bookmark organization.

The real problem is:

> “I save too many things and need a low-friction way to decide what is actually worth reading.”

Therefore, the product should optimize for fast, confident decisions rather than becoming another bookmark dashboard.

## Core Promise

> Clear or prioritize 20 Daily.dev bookmarks in 5 minutes.

The product wins when a user opens it, makes a batch of decisions, rescues a few high-value reads, and clears out items they no longer care about.

## Target User

Primary user:
- A Daily.dev user who saves many posts but rarely revisits them
- Likely a developer, engineering lead, founder, or technical learner
- Comfortable with API tokens and lightweight productivity tools
- Wants less backlog guilt and a more intentional reading queue

## Product Principles

1. **Decision-first, dashboard-second**
   - The main interaction should be choosing what happens to one bookmark at a time.

2. **Deletion should feel safe**
   - Removing bookmarks must be clearly communicated and reversible where possible.

3. **Shortlist must stay small**
   - The Shortlist should represent real reading intent, not another backlog.

4. **Scores must be explainable**
   - Users should see why a bookmark is recommended, not just a number.

5. **Anti-library is guilt-free**
   - “Later” is not failure. It is an intentional holding zone.

---

## Philosophy Mapping

| Readwise Concept | Daily.dev Implementation | Product Note |
|---|---|---|
| Inbox | All unread bookmarks | Main triage source |
| Later | Dedicated bookmark list: `📚 Later` | Anti-library holding zone |
| Shortlist | Dedicated bookmark list: `⭐ Shortlist` | Must-read queue, ideally capped |
| Archive | Remove bookmark from Daily.dev | UI should call this “Remove Bookmark” or “Clear Out” |
| Daily Digest | Surface 5 old or valuable bookmarks each session | Rediscovery hook |
| AI Justify | Score and explain bookmark priority | Must show reasons, not only score |
| Bump to Top | Sort visually inside app | UX-only unless API supports ordering |
| Filtered Views | Filter by tag, source, read time, age | Useful after MVP |

---

## MVP Scope

### MVP Goal

Help the user process a meaningful chunk of their bookmark backlog quickly and safely.

### MVP Success Metric

A user can triage at least 20 bookmarks in one session without confusion or fear of accidental deletion.

### MVP Features

#### 1. API Token Setup

- First-run setup screen
- User enters Daily.dev Public API token
- Token stored in `localStorage`
- Friendly validation errors for invalid or expired tokens

#### 2. Fetch Unread Bookmarks

- Fetch unread bookmarks using Daily.dev Public API
- Support pagination so the user’s full unread backlog is available
- Show loading, empty, and error states

#### 3. One-Card Triage Mode

Primary interface:
- One bookmark card at a time
- Shows title, source, tags, read time, upvotes, saved date, score, and short snippet if available
- Actions:
  - `S` → Move to Shortlist
  - `L` → Move to Later
  - `D` / `E` → Clear Out / Remove Bookmark
  - `Space` → Skip / Keep in Inbox

#### 4. Shortlist and Later Lists

- Create `⭐ Shortlist` list if missing
- Create `📚 Later` list if missing
- Move bookmarks into these lists using the Daily.dev API
- Shortlist should visually recommend a limit, for example: “Keep this under 10”

#### 5. Explainable Priority Score

Compute a 0–100 “worth reading” score.

Initial scoring model:

```js
score =
  upvotes_weight +
  recency_weight +
  read_time_weight +
  tag_match_weight
```

Suggested weighting:
- Upvotes: 40%
- Recency: 25%
- Read time fit: 20%
- Tag affinity: 15%

Score labels:
- `🔥 Hot` — high-value, likely worth reading
- `📖 Read` — good candidate
- `🗃️ Maybe` — safe to defer
- `🧹 Clear Out` — likely stale or low priority

Each score should include reasons, for example:

> High upvotes · 6 min read · matches your JavaScript saves

#### 6. Undo Queue

Because removing a bookmark is destructive, the MVP should include a lightweight undo pattern:
- Show the last action taken
- Allow undo for recent actions in the current session
- For delete/remove, delay the actual API delete briefly where possible, or provide a confirmation step

---

## Out of Scope for MVP

These are valuable, but should not block the first usable version:

- Full stats dashboard
- Bookmark growth charts
- Tag cloud
- Triage streak
- Bulk delete / “Nuke the Pile” actions
- Daily Digest carousel
- Advanced filters
- Drag-and-drop interactions
- Swipe animations
- Multi-user support
- Backend sync

---

## UX Structure

### Primary Layout

The app should have three major zones:

1. **Today’s Focus**
   - In MVP, this can simply show session progress.
   - Later, this becomes the Daily Digest.

2. **Triage Card**
   - The main interaction.
   - One bookmark, one decision.

3. **Decision Summary**
   - Counts for Shortlisted, Later, Cleared Out, Skipped.
   - Shows progress toward the session goal.

### MVP Dashboard Layout

```text
------------------------------------------------
| Anti-Library                                  |
| Clear or prioritize 20 bookmarks in 5 minutes|
------------------------------------------------
| Session Progress: 8 / 20 decisions            |
------------------------------------------------
|                                              |
|              [ Bookmark Card ]               |
|                                              |
|  S Shortlist   L Later   Space Skip   D Clear|
|                                              |
------------------------------------------------
| Shortlisted: 2 | Later: 4 | Cleared: 1 | Skip: 1 |
------------------------------------------------
```
---

## Scoring Model

### Inputs

Use fields available from Daily.dev where possible:
- Upvotes
- Read time
- Bookmark age
- Tags/topics
- Source
- Whether the user has bookmarked similar topics before

### Scoring Formula

```js
score =
  upvoteScore * 0.40 +
  recencyScore * 0.25 +
  readTimeFitScore * 0.20 +
  tagAffinityScore * 0.15;
```

### Score Components

#### Upvote Score

Higher upvotes increase priority, but should be normalized so extremely viral posts do not dominate everything.

#### Recency Score

Newer posts score higher, decaying over roughly 30 days.

#### Read Time Fit

Ideal range: 3–8 minutes.

Reasoning:
- Under 3 min: may be lightweight or lower depth
- 3–8 min: most likely to be read soon
- Over 15 min: valuable but harder to start

#### Tag Affinity

Topics the user frequently bookmarks should receive a small boost.

This should not dominate the score, because it can trap users in a filter bubble.

### Score Explanation

Every score badge should expose a short reason string:

```text
🔥 Hot — 82
High upvotes · 5 min read · matches your React saves
```

---

## Roadmap

## Phase 1 — Triage MVP

### Objective

Build the core bookmark decision loop.

### Features

- API token setup
- Fetch unread bookmarks
- Create/find Shortlist and Later lists
- One-card triage interface
- Keyboard shortcuts
- Basic scoring
- Score explanation
- Session progress counter
- Recent-action undo
- Friendly API error handling

### Success Criteria

- User can connect API token
- User can fetch unread bookmarks
- User can move a bookmark to Shortlist
- User can move a bookmark to Later
- User can remove a bookmark with clear warning
- User can skip a bookmark
- User can process at least 20 bookmarks in one session

---

## Phase 2 — Daily Digest and Shortlist Discipline

### Objective

Make the app useful even when the user does not want to do a full triage session.

### Features

#### Daily Digest

On each session load, surface 5 bookmarks:
- 2 oldest unread bookmarks older than 30 days
- 2 highest-scored unread bookmarks
- 1 random wildcard

Display copy:

> Your daily picks — don’t let these rot 🌿

#### Shortlist Discipline

- Show Shortlist count prominently
- Recommend keeping Shortlist under 10
- Warn when Shortlist grows too large
- Sort Shortlist by score descending

### Success Criteria

- User can get value from opening the app for less than one minute
- User has a clear “read this next” list
- Shortlist does not become another backlog

---

## Phase 3 — Backlog Surgery Tools

### Objective

Help users reduce large bookmark backlogs safely.

### Features

Bulk actions should always include preview and confirmation.

| Action | Description | Safety Requirement |
|---|---|---|
| Clear bookmarks older than 90 days | Removes stale saves | Preview list before delete |
| Clear low-score bookmarks | Removes score < 20 | Preview and allow exclusions |
| Promote top 10 to Shortlist | Moves best unread items | Confirm before moving |
| Quick-read session | Filters to < 5 min reads | Non-destructive |

### Product Language

Use “Clear Out” or “Remove Bookmark,” not “Archive,” because Daily.dev does not have a true archive state in this plan.

### Success Criteria

- User can reduce backlog size without fear
- User understands exactly what will be removed before confirming
- No destructive bulk action happens without review

---

## Phase 4 — Stats and Insights

### Objective

Add motivation and reflection after the core workflow is proven.

### Features

- Total bookmarks
- Shortlist count
- Later count
- Estimated total backlog reading time
- Bookmark growth over time
- Most-saved tags/topics
- Source breakdown
- Triage streak

### Product Warning

Stats should drive action, not passive guilt.

Each insight should include an action, for example:

```text
You have 42 posts tagged JavaScript. Start a JavaScript-only triage session?
```

---

## Phase 5 — Polish and Power Features

### Possible Additions

- Advanced filters by tag, source, read time, score, age
- Saved filter presets
- Swipe gestures
- Drag-and-drop list movement
- Export triage summary
- Configurable scoring preferences
- “Reading sprint” mode
- PWA support
- Optional encrypted token storage strategy

---

## Product Risks and Mitigations

### Risk 1: Users do not trust delete actions

Mitigation:
- Rename destructive action to “Remove Bookmark” or “Clear Out”
- Add confirmation for destructive bulk actions
- Add undo for recent actions
- Avoid calling it “Archive” if it actually deletes/removes

### Risk 2: Scoring feels arbitrary

Mitigation:
- Show score reasons
- Keep score advisory, not authoritative
- Allow users to ignore score easily
- Consider user-adjustable scoring later

### Risk 3: Shortlist becomes another backlog

Mitigation:
- Recommend a visible limit
- Sort by priority
- Add “This week’s reads” framing
- Nudge user when Shortlist exceeds 10

### Risk 4: API capabilities differ from assumptions

Mitigation:
- Verify API schema before implementation
- Build API wrapper with clear error handling
- Gracefully degrade if fields like read time or tags are unavailable

### Risk 5: Local-only state gets lost

Mitigation:
- Accept this for MVP
- Make Daily.dev lists the source of truth for final triage decisions
- Use localStorage only for convenience and session state

---

## Verification Plan

### Manual Verification

1. Enter Daily.dev API token and confirm bookmarks load
2. Fetch unread bookmarks across multiple pages
3. Move a bookmark to Shortlist and verify in Daily.dev UI
4. Move a bookmark to Later and verify in Daily.dev UI
5. Remove a bookmark and verify it disappears from Daily.dev bookmarks
6. Skip a bookmark and confirm it remains in Inbox
7. Refresh page and confirm local session state persists
8. Confirm score badges render correctly
9. Confirm score explanations are visible
10. Confirm keyboard shortcuts work
11. Confirm error states for invalid token and rate limits
12. Confirm undo works for recent actions where supported

### Automated Checks

- API wrapper handles 401 unauthorized
- API wrapper handles 429 rate limit
- Pagination fetches all bookmarks
- Bookmark scoring handles missing fields
- Triage state persists to localStorage
- Creating lists is idempotent
- Moving bookmarks handles API failures
- Delete/remove action requires explicit user intent

---

## Implementation Order

### Step 1: Skeleton UI

- `index.html`
- `style.css`
- Token screen
- Empty dashboard state

### Step 2: API Wrapper

- Token handling
- Fetch bookmarks
- Fetch/create lists
- Move bookmark
- Remove bookmark
- Error handling

### Step 3: Triage Engine

- Current bookmark pointer
- Decision actions
- Session progress
- Persisted seen IDs
- Undo queue

### Step 4: Scoring

- Implement initial score formula
- Render score badge
- Render explanation text
- Handle missing data gracefully

### Step 5: MVP Polish

- Keyboard shortcuts
- Loading states
- Empty states
- Friendly errors
- Confirmation for destructive actions

---

## Recommended v1 Acceptance Criteria

The first version is ready when:

- A user can enter their Daily.dev API token
- The app loads unread bookmarks
- The app creates or finds Shortlist and Later lists
- The user can triage one bookmark at a time
- The user can use keyboard shortcuts for all core actions
- The app displays a useful score and explanation
- The app clearly distinguishes Remove Bookmark from non-destructive actions
- The user can process 20 bookmarks in a single session
- The app does not lose critical triage results on refresh

---

## Final PM Recommendation

Build this as a decision engine, not a bookmark manager.

The killer experience is:

> “I opened the app, made 15 decisions, rescued 3 good reads, and cleared 12 things I no longer care about.”

That is the product. Everything else should support that loop.

