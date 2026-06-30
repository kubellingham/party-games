# Memories

The system that makes Gatherd's core promise real: **preserving meaningful moments between friends.**
Not a stats page — a living record of *what you've shared*. Owned by **`platform/memories`**. If the
vision is "moments over metrics," this is the doc where the platform keeps its promise.

## Why this exists

Other apps remember your *score*. Gatherd remembers your *story*: the night you all played until 1am,
the running joke from a Trivia answer, the one-year mark since this group first played together. These
moments are why people come back — to each other.

## What counts as a memory

Memories are about people-together, captured as they happen:

- **Shared sessions** — "you and 4 friends played 6 games last Friday."
- **Memorable games** — standouts (a blowout, a nail-biter, a perfect game).
- **Anniversaries** — "one year since your first game with Sam."
- **Funniest moments** — surfaced from game-specific events (e.g. the lone-dissenter Would You Rather
  answer, a wildly wrong trivia guess) and/or reactions.
- **Compatibility** — light, positive signals ("you and Mia agree 78% of the time on Would You Rather").
- **Milestones** — "100 games together," "first time playing [game]."

Deliberately **not** dry stats. Stats may *feed* a memory ("100 games"), but the artifact is a moment,
phrased warmly, tied to people.

## How it works (event-sourced projection)

Memories is a **consumer** that builds timelines from events as they flow — it captures moments live, so
nothing is lost. The events are the source of truth; the timeline is a rebuildable projection.

```
room.player_joined / game.finished / game.scores_finalized ─▶ memories: who played with whom, when
game-specific highlight events (e.g. wyr.round_revealed)    ─▶ memories: funny/standout candidates
date ticks                                                  ─▶ memories: anniversaries, milestones
```

```ts
interface Memory {
  id: string;
  kind: "session" | "memorable_game" | "anniversary" | "funny_moment" | "compatibility" | "milestone";
  participants: string[];          // the people it's shared with
  occurredAt: number;
  title: string;                   // warm, human phrasing
  detail?: string;
  refs?: { roomId?: string; gameId?: string; eventIds?: string[] };  // provenance
  visibility: "shared";            // shared memories require mutual participation
}

// Timelines are keyed by relationship: a friendship pair or a recurring group.
interface MemoryTimeline { key: string; participants: string[]; memories: Memory[]; }
```

## Where memories surface

- **Post-game (Results):** "that was your closest game yet," a fresh anniversary — celebrated with the
  group in the moment (`room-experience.md`).
- **Profile:** a curated showcase the player pins (`social.md`).
- **Home:** the "Continue / play again with [group]" and the occasional "on this day" resurfacing
  (`home-and-navigation.md`).
- **Notifications (later):** "it's been a year — want to play with Sam again?" — a re-engagement hook
  that is genuinely warm, not spammy.

## Privacy (essential)

- Memories are **shared by construction** — they involve multiple participants, so they require **mutual
  participation** to view. You only see a shared memory if you were there.
- No surfacing of a memory to someone who wasn't part of it. Blocking (`social.md`) suppresses shared
  memories.
- Compatibility/insight memories stay positive and consensual; nothing that could embarrass.

## Relationship to AI (later)

AI can make memories richer — detecting the genuinely funny moment, writing the post-game recap,
spotting a meaningful pattern (`ai-vision.md`). Memories is designed so AI is an **optional enhancer**: a
consumer that proposes higher-quality `funny_moment` / `session` summaries, gated before they're shown.
The base system works without any AI.

## Events

**Consumes:** `room.player_joined`, `game.finished`, `game.scores_finalized`, selected game-specific
highlight events, `day.tick`.

**Emits:** `memory.created`, `memory.anniversary_due` (drives notifications/home resurfacing).

## Open questions (→ `open-questions.md`)

- Which game events qualify as "funny/standout," and do games need to **declare highlight events**
  explicitly in their contract? (small addition to the game/event contract — worth deciding early)
- Retention: do memories live forever? Storage + privacy implications at scale.
- Notification cadence for anniversaries/resurfacing (warm vs annoying).

## Build-now vs later

This is a **later** system (after the core loop + social exist) — but it's documented now because two
upstream choices must accommodate it today: the **event taxonomy** (`events.md`) should include the room
membership + highlight events memories needs, and games may need a way to mark **highlight events**. We
design those hooks now; we build memories when the social graph is real.
