# Home Screen & Navigation

The home screen is Gatherd's front door and its "alive between sessions" promise. It must get a group
into a game in seconds *and* make the platform feel warm when no one is mid-game. Built mobile-first.

## Navigation model

A persistent **bottom navigation bar** (thumb-reachable on phones), part of the locked Gatherd shell
(`design-language.md`) — identical across the whole app:

| Tab | Purpose |
| --- | --- |
| **Home** | Jump back in: primary actions, recent, featured |
| **Play** | The game library — browse/filter all games |
| **Social** | Friends, recent players, parties, invites |
| **Shop** | Cosmetics, packs, gems, Premium |
| **Profile** | Identity, progression, memories, settings |

Top of each screen: a lightweight header (context title + balances/level chip). The shell is constant;
only content changes. Deep links (room codes) overlay a join prompt on top of any tab.

## Home as composable modules

Home is **not** a fixed layout — it's an ordered list of **cards/modules**, each fed by exactly one
context. New sections (seasonal, new game spotlight) drop in without restructuring. This is what lets
Home evolve as the platform grows.

```ts
interface HomeModule {
  id: string;
  kind: "primary_actions" | "continue" | "library_row" | "featured" | "seasonal"
      | "friends_online" | "daily_reward" | "progression_summary" | "new_game";
  priority: number;                    // ordering
  visibleWhen?: (ctx) => boolean;      // e.g. seasonal only during an active season
}
```

### Default modules (top to bottom)

1. **Primary actions** — Create room · Join by code · Quick Play. The fastest path; always first.
   *(catalog / room)*
2. **Continue** — "Rejoin your game" if a session is live; "Play again with [group]" from last session.
   *(room / memories)*
3. **Friends online** — who's around right now + one-tap invite. The social pull. *(social)*
4. **Featured / New game** — spotlight a game or a flagship original. *(catalog / first-party)*
5. **Seasonal** — active live event, only during a season. *(liveops / seasonal-events.md)*
6. **Daily reward / streak** — the "come back tomorrow" beat. *(progression / economy)*
7. **Library row(s)** — quick categories ("Quick & funny", "Trivia", "5+ players"). *(catalog)*
8. **Progression summary** — level, coins/gems, nearest unlock. *(progression / economy)*

Order encodes priorities: **gather first** (actions, continue, friends), then **stay engaged**
(featured, seasonal, daily), then **browse/explore** (library), then **self** (progression).

## The Play tab (game library)

- Full catalog from `catalog` (manifests), filterable by category, player count ("we're 6"), duration
  ("10 minutes"), and age rating.
- Each game card uses manifest assets + tagline; tapping opens a detail view (description, players,
  packs, "create room with this game").
- Gated games (`entitlement: "premium"`) show a lock + acquire path (`economy.md`).

## How contexts feed Home (read models, not reach-ins)

Each module calls one context's **query API**; Home composes the results. Home owns no domain data — it
is a renderer. This keeps Home decoupled and makes modules independently testable/cacheable.

## Accessibility & responsiveness

- Thumb-zone bottom nav; large touch targets; works one-handed.
- Scales from phone → tablet/desktop (the same modules reflow into columns).
- Respects reduced-motion; balances/level chips have text, not color-only, signals.

## Open questions (→ `open-questions.md`)

- Is **Quick Play** present at launch (drives whether primary-actions has 2 or 3 buttons)?
- Default module ordering — validate with early users; is "friends online" above "featured" right?

## Build-now vs later

- **Now (when implementation resumes):** Home with primary actions + continue + a simple library row;
  bottom nav with Home/Play/Profile (Social/Shop can stub until those contexts land).
- **Later:** featured/seasonal/daily modules, full library filtering, Shop tab, the module config system
  as data.
