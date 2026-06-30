# Gatherd — Design Documentation

This folder is the **spec we implement from**. It defines Gatherd's platform systems before we build
them, so adding games and features later is additive rather than a rewrite. Read
[`../VISION.md`](../VISION.md) first — every doc here serves it.

> Status: **design phase.** These documents describe intended design. The current codebase implements
> only the Phase 0/1 foundation (see [`architecture.md`](./architecture.md)). Each doc is reviewed
> before its implementation begins.

## How the docs relate

```
VISION.md ........... why Gatherd exists (the tie-breaker for every decision)
architecture.md ..... the bounded-context map + event-driven backbone (read this second)
data-model.md ....... every entity and which context owns it
events.md ........... the platform event taxonomy contexts subscribe to

Player-facing systems          Platform systems              Experience & brand
- progression.md               - content.md                  - ux-flows.md
- economy.md                    - game-manifest.md            - home-and-navigation.md
- cosmetics.md                 - social.md                    - room-experience.md
- memories.md                  - seasonal-events.md          - design-language.md
                               - ai-vision.md
                               - first-party-games.md

open-questions.md ... decisions still owned by product (PM)
```

## Reading order

1. [`../VISION.md`](../VISION.md) — purpose and principles.
2. [`architecture.md`](./architecture.md) — how everything fits and talks.
3. [`data-model.md`](./data-model.md) + [`events.md`](./events.md) — the shared contracts.
4. Any individual system doc — each is self-contained: data model, owning context, events
   emitted/consumed, UX surface, and open questions.

## Index

| Doc | What it defines |
| --- | --- |
| [architecture.md](./architecture.md) | Bounded contexts, event bus backbone, implementation roadmap |
| [data-model.md](./data-model.md) | Consolidated entities + ownership |
| [events.md](./events.md) | Platform event taxonomy (beyond canonical lifecycle) |
| [progression.md](./progression.md) | XP, levels, titles, achievements |
| [economy.md](./economy.md) | Coins, gems, wallet, ledger, entitlements, Premium |
| [cosmetics.md](./cosmetics.md) | Cosmetic types, ownership, loadout |
| [content.md](./content.md) | Content packs, categories, CMS, AI pipeline, moderation |
| [game-manifest.md](./game-manifest.md) | The metadata standard every game implements |
| [social.md](./social.md) | Profiles, friends, recent players, parties, invites, safety |
| [memories.md](./memories.md) | The meaningful-moments system |
| [seasonal-events.md](./seasonal-events.md) | Seasons & live events architecture |
| [ai-vision.md](./ai-vision.md) | Long-term AI surface (architecture only) |
| [first-party-games.md](./first-party-games.md) | Original-games brand strategy |
| [ux-flows.md](./ux-flows.md) | End-to-end player flow + screen states |
| [home-and-navigation.md](./home-and-navigation.md) | Home IA + navigation |
| [room-experience.md](./room-experience.md) | Lobby → in-game → results |
| [design-language.md](./design-language.md) | The Gatherd design system (locked shell + game theme) |
| [open-questions.md](./open-questions.md) | Decisions for product |
| [pm-onboarding-brief.md](./pm-onboarding-brief.md) | Self-contained brief to bootstrap the PM/Architect chat |
| [decisions/](./decisions/) | ADR-lite decision log (durable team memory) |

> Team & collaboration model (roles, decision rights, how the two AI chats communicate):
> see [`../TEAM.md`](../TEAM.md).

## Conventions used in these docs

- **Bounded context** — an independently-owned slice of the domain (its own data + logic). Contexts
  talk via events, never by reaching into each other's storage.
- **Event-sourced projection** — a read model built by consuming events; the events are the source of
  truth, the projection is a cache that can be rebuilt.
- **Entitlement** — a record that a player *has* something (a pack, a cosmetic, Premium).
- TypeScript-ish type sketches are **illustrative**, not final signatures.
