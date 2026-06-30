# Progression

XP, levels, titles, and achievements — the sense that playing Gatherd *accrues* into something.
Owned by the **`platform/progression`** context (expansion of the existing `platform/profile`).

Aligned to the vision: progression celebrates **moments**, not grind. Level-ups and achievements are
hooks for shared delight (the table sees "Alex hit level 10"), not a treadmill.

## Responsibilities

- Award and track **XP** and derive **levels**.
- Track **achievement** progress and unlocks.
- Manage **titles** (unlockable labels, one equipped).
- Produce the **rewards moment** data shown on the results screen.

It does *not* own currency (that's `economy`) or cosmetics (that's `cosmetics`); it *triggers* grants
in those contexts by emitting events.

## How it works (event-driven)

Progression is a **consumer**. It already reacts to canonical lifecycle events; we extend the rule set.

```
game.finished / game.scores_finalized ─▶ progression: award participation + performance XP
achievement criteria met               ─▶ progression: unlock achievement -> emit reward events
daily streak / first-play-of-day       ─▶ progression: bonus XP (via a daily tick)
```

When progression grants a reward it does not own, it **emits an event** other contexts react to:
`achievement.unlocked` → economy grants coins, cosmetics grants an item, etc. Progression never writes
to the wallet directly.

## XP & levels

- **Sources:** participation (finishing a game), performance (placement/score from
  `game.scores_finalized`), achievements, daily streaks, seasonal challenges (`seasonal-events.md`).
- **Curve:** rising XP-per-level (e.g. `xpForLevel(n) = base * n^1.5`, tuned later). Stored as total XP;
  level is derived, so the curve can be retuned without data migration.
- **Premium / events** may apply an XP multiplier (a modifier resolved at award time, not baked in).

```ts
interface PlayerProgress {
  playerId: string;
  xp: number;              // total lifetime XP; level derived from this
  level: number;           // cached projection of levelFor(xp)
  equippedTitle: string | null;
  unlockedTitles: string[];
  // achievement progress keyed by achievement id
  achievements: Record<string, { progress: number; unlockedAt: number | null }>;
}
```

## Achievements

Rule-based, evaluated from events. Definitions are **data**, not code, so designers add achievements
without engine changes.

```ts
interface AchievementDef {
  id: string;
  name: string;
  description: string;
  scope: "global" | { gameId: string };     // cross-game or per-game
  criteria: AchievementCriteria;             // event type + aggregation + threshold
  reward?: { xp?: number; coins?: number; cosmeticId?: string; titleId?: string };
  secret?: boolean;                          // hidden until unlocked
}
```

- **Criteria** describe an event pattern + aggregation: "count of `game.finished` where gameId=X ≥ 10",
  "first `wyr.round_revealed` where you were sole minority". Kept declarative so AI or a CMS can propose
  achievements later (`ai-vision.md`).
- **Idempotent:** progress updates and unlocks are keyed by event id; replays never double-count.
- **Rewards** are emitted as events; the owning context applies them.

## Titles

Cosmetic-but-meaningful labels ("Trivia Royalty", "Founding Member"). Unlocked by level milestones,
achievements, or seasonal events. One equipped at a time, shown on the player chip and profile. Owning
the title is an entitlement-like fact tracked here (simple list) since titles are progression rewards;
purely-purchasable titles, if any, would be entitlements (`economy.md`).

## The rewards moment

The results screen (`room-experience.md`) is where progression pays off emotionally. After a game,
progression provides a **reward summary** per player:

```ts
interface RewardSummary {
  xpGained: number;
  newLevel?: number;            // present if leveled up
  achievementsUnlocked: { id: string; name: string }[];
  // coins shown here are sourced from economy via events; progression aggregates for display
  coinsGained?: number;
}
```

This is delivered as a read model the results screen queries (or pushed in the results payload). It is
the retention beat — make level-ups and unlocks feel like a group event.

## Events

**Consumes:** `game.finished`, `game.scores_finalized`, game-specific events (for per-game
achievements), `day.tick` (daily), `season.*` (challenges).

**Emits:** `progression.xp_awarded`, `progression.leveled_up`, `achievement.unlocked`,
`progression.title_unlocked`. (Payload sketches in `events.md`.) Economy/cosmetics consume the reward
fields of these.

## Open questions

- XP curve shape and target session-to-level pacing (tunable; needs playtest).
- Are there purchasable titles, or are titles always earned? (affects whether titles are entitlements)
- Do achievements ever award gems (hard currency), or only coins/cosmetics/XP? (monetization)

## Build-now vs later

- **Now (when implementation resumes):** XP + levels + the results reward moment (already have the XP
  seed). A handful of starter achievements.
- **Later:** full declarative achievement engine, titles marketplace, seasonal challenges.
