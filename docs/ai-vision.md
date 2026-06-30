# AI Vision (Architecture Only)

Where AI fits in Gatherd's long-term architecture. **Nothing here is built now.** The purpose of this
doc is to ensure today's data model and event taxonomy leave the right hooks, so AI features can be added
later as decoupled services rather than as invasive rewrites.

## Guiding principle: AI is just another consumer

AI does not get special access. Each AI capability is a **service that hangs off the event bus and/or
queries context read models**, exactly like a platform context — with a clear input (events/state) and a
clear, **gated** output (a draft, a suggestion, a flag). This keeps AI:

- **optional** — the platform works fully without it,
- **decoupled** — it never reaches into game logic or another context's storage,
- **safe** — its outputs pass the same review/moderation gates as any content or action.

```
            EVENT BUS  +  context query APIs
                  │
   ┌──────────────┼───────────────┬───────────────┬───────────────┐
   ▼              ▼               ▼               ▼               ▼
content gen   recommendations  moderation     insights        post-game
(→ content    (→ home/catalog) assist         (→ memories/     summaries
 pipeline)                     (→ safety)      profile)        (→ memories)
   │              │               │               │               │
   └── all outputs are GATED (human review / policy / opt-in) before they reach players
```

## The capabilities (future)

### 1. Content generation
Produce draft content-pack items (trivia Q&A, prompts) via the Claude API. Feeds the **existing content
pipeline** (`content.md`): generate → moderation → human review → publish. Provenance `authorship:"ai"`.
Models: `claude-opus-4-8` for quality, `claude-sonnet-5` for volume/cost. Already designed as one stage
in the content pipeline — no new path.

### 2. Recommendations
"What should this group play next?", "packs you'll like," "people you might add." A consumer of
play history + social events that produces ranked suggestions surfaced on Home/Play (`home-and-
navigation.md`). Read-only; never auto-acts.

### 3. Moderation assistance
Assist (not replace) human moderation: classify reported content/behavior, triage queues, flag risky
AI/UGC before human review (`content.md`, `social.md` safety). Output is a **flag/score**, the decision
stays gated.

### 4. Personality & compatibility insights
Light, positive, consensual insights from gameplay ("your group loves spicy prompts," "you and Mia rarely
agree — chaos"). Feeds `memories.md` / profiles. Strictly opt-in, never judgmental, never surfaced to
non-participants.

### 5. Post-game summaries
A warm recap of a session — "tonight's highlights" — turning raw events into a shareable moment. Feeds
`memories.md` as a higher-quality `session`/`funny_moment` memory, gated before display. This is AI in
direct service of the vision (moments over metrics).

## What we must get right *now* (hooks, not features)

So future AI is cheap to add, today's foundational docs should ensure:

- **Rich event taxonomy** (`events.md`): membership, highlights, outcomes, content usage — AI learns from
  events, so the events must exist and be captured.
- **Highlight events**: games able to mark standout moments (also needed by `memories.md`) — decide this
  in the game/event contract early.
- **Provenance + gating** in the content pipeline (`content.md`) so AI output is reviewable.
- **Read models with query APIs** on each context, so an AI service can read without coupling.
- **Privacy/consent fields** on profile/memories so insights can be opt-in by design.

## Cost, latency, safety (when we build)

- AI runs **off the hot path** (async consumers/jobs), never blocking a game or a player action.
- Outputs are cached and gated; user-facing AI text is reviewed or clearly labeled.
- Spend is bounded per capability; generation favors batch/offline over per-request where possible.

## Open questions (→ `open-questions.md`)

- Which capability is the **first** AI investment when the time comes (likely content generation — it has
  the clearest ROI and a ready pipeline)?
- Human-in-the-loop requirements per capability (esp. generation + moderation).
- Data/consent policy for using gameplay to derive insights.

## Build-now vs later

**Not built now.** The deliverable from this doc is a checklist (above) applied to the systems we *do*
build first — chiefly the event taxonomy, highlight events, and content provenance — so AI slots in later
without refactoring. We **stop and ask** before any AI feature, given product, cost, and safety weight.
