# Seasonal Events & Live Ops

Recurring, time-bounded experiences — Halloween, Christmas, Summer, anniversaries of Gatherd itself —
that make the platform feel current and give groups a reason to return *now*. Owned by
**`platform/liveops`**. The goal is that adding a season is **configuration, not a release**.

## Why design this now (even though we build it later)

Seasonal content is where many platforms accrue technical debt: each holiday gets hacked in, then
ripped out. By defining the seam early, every system we build (content, economy, cosmetics, progression)
gets a clean "limited-time" mode for free, and a season becomes data we schedule.

## The model: a Season/Event is a scheduling object

```ts
interface LiveEvent {
  id: string;                       // "halloween_2026"
  name: string;
  window: { from: number; to: number };       // activation window (UTC)
  theme?: GameThemeAccent;          // optional seasonal accenting (within the locked shell!)
  activates: {
    contentPackIds?: string[];      // themed packs go live (content.md)
    skuIds?: string[];              // limited-time SKUs: cosmetics, bundles (economy.md)
    cosmeticIds?: string[];         // seasonal cosmetics become acquirable (cosmetics.md)
    challenges?: SeasonalChallenge[]; // event XP/coin challenges (progression.md)
  };
  rewards?: SeasonalReward[];       // event-completion rewards (time-bounded entitlements)
}
```

A season **activates and deactivates** existing seams by id — it does not introduce parallel
implementations. When the window opens, themed packs/SKUs/cosmetics/challenges turn on; when it closes,
they turn off (and limited entitlements expire).

## Built on existing seams (no new mechanisms)

| Seasonal feature | Reuses |
| --- | --- |
| Themed question packs | `content.md` packs with `availability` window |
| Limited-time cosmetics | `cosmetics.md` + `availability` |
| Event store offers / bundles | `economy.md` SKUs with `availability` |
| Event challenges & rewards | `progression.md` challenges → reward events |
| Time-bounded unlocks | `economy.md` **time-bounded entitlements** (same mechanism as Premium) |
| Seasonal look | `design-language.md` **accent/artwork only** — the locked shell never changes |

The one genuinely new thing `liveops` adds is **scheduling**: turning bundles of existing ids on/off by
time window, and emitting the events that let other contexts react.

## Seasonal theming stays on-brand

A season may tint accents and swap artwork (pumpkins, snow) — using the **same Layer-2 budget** games
get (`design-language.md`). Navigation, typography, spacing, and components remain Gatherd. The app feels
festive, never like a different app.

## Surfacing

- **Home:** a seasonal module appears only while a season is active (`home-and-navigation.md`).
- **Shop:** limited-time SKUs flagged with a countdown.
- **Results/lobby:** seasonal challenges and rewards shown in context.
- **Memories:** "you played every Halloween event since 2026" is a milestone memory (`memories.md`).

## Events

**Emits:** `season.started`, `season.ended`, `season.reward_granted`, `season.challenge_completed`.
Content/economy/cosmetics/progression consume these to flip availability and grant rewards. Time-bounded
entitlements emit `entitlement.expired` when the window closes.

## Operational notes

- Seasons are **data** (a `LiveEvent` record), ideally editable without deploy (CMS-adjacent).
- Activation is timezone-aware (a global `from/to` in UTC; presentation localizes).
- Overlapping events are allowed (e.g. an anniversary during summer) — `liveops` composes active sets.

## Open questions (→ `open-questions.md`)

- Cadence and ambition of the first seasons (drives how much tooling is worth building first).
- Are seasonal rewards ever exclusive-forever (FOMO) vs returning each year? (player goodwill vs urgency)
- Who authors/schedules seasons (founder/PM now; a tool later)?

## Build-now vs later

**Later** system. Designed now so the building blocks it depends on — `availability` windows on
content/SKUs/cosmetics, **time-bounded entitlements**, and seasonal challenge hooks in progression — are
included in those systems' first real implementations rather than retrofitted.
