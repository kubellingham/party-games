# Architecture

How Gatherd is structured so that dozens of games and a deep social layer can grow without the system
collapsing under its own weight. Read [`../VISION.md`](../VISION.md) first.

## One idea, repeated everywhere

**Server-authoritative game sessions emit facts onto an event bus; independent bounded contexts react
to those facts without the game engine knowing they exist.**

Everything else is an application of that idea. A game produces facts ("round finished," "scores
finalized"). Progression, economy, memories, analytics, achievements, and (later) AI each *react* to
the facts they care about. Adding a reaction never touches the game.

```
 game module ──reduce()──▶ engine runtime ──envelope──▶  EVENT BUS  ──▶ progression
   (rules)                  (authoritative,              (versioned     ──▶ economy
                            1 adapter)                    contract)      ──▶ memories
                                                                         ──▶ achievements
                                                                         ──▶ analytics
                                                                         ──▶ … (new = new consumer)
```

## The dependency rule (the discipline that keeps this honest)

- The **game engine depends on nothing platform-side.** It never imports progression, economy, social,
  etc. It only knows how to run a game and emit facts.
- Platform contexts depend on the **event contract** (`docs/events.md`), not on each other's internals.
- When one context needs another's data to *read* (e.g. the lobby showing a player's level), it goes
  through that context's **query API / read model** — never a shared table or a direct import.

If you ever find a game importing `@party/platform-*`, the architecture has been violated.

## Current state (what's actually built)

The Phase 0/1 foundation exists and is tested (see repo root `README.md`):

| Package | Role | Status |
| --- | --- | --- |
| `packages/contracts` | Event envelope + canonical lifecycle event schemas | built |
| `packages/event-bus` | Bus interface + in-process impl (at-least-once, idempotency) | built |
| `packages/engine` | `GameDefinition`, authoritative runner, runtime adapter, view projection | built |
| `packages/games/would-you-rather` | First game module | built (will be refactored — see roadmap) |
| `packages/platform/profile` | Progression consumer (XP) | built (will split — see roadmap) |
| `apps/server` | Colyseus transport + `RoomController` + composition root | built |
| `apps/web` | React/Vite PWA shell | built |

The **canonical lifecycle events** already emitted for every game: `game.started`,
`game.turn_started`, `game.finished`, `game.scores_finalized`. These alone power progression and
analytics for any game with zero per-game code.

## Target context map

```
Realtime / transport
  apps/server         Colyseus rooms; RoomController is the transport-agnostic room logic
  apps/web            PWA client (thin renderer of server views)

Core engine (knows no platform)
  packages/engine     GameDefinition contract, runner, runtime adapter, projectView
  packages/contracts  event envelope, canonical events, shared types + manifest schema
  packages/event-bus  bus interface + impls

Platform bounded contexts (each: own data + query API, react to events)
  platform/identity      accounts, guest→user upgrade, public profile records
  platform/progression   XP, levels, titles, achievements        (expands platform/profile)
  platform/economy       wallet (coins+gems), ledger, Premium entitlement
  platform/entitlements  ownership of packs/cosmetics/premium
  platform/cosmetics     cosmetic catalogue + equipped loadout
  platform/catalog       game manifests registry + query API
  platform/content       content packs/items, categories, CMS hooks, AI pipeline, moderation
  platform/social        friends, recent players, parties, invites, presence, safety
  platform/memories      meaningful-moment timeline per friendship/group
  platform/liveops       seasons & live events scheduling
  platform/ai            (future) AI services off the bus

Design system
  packages/ui            locked Gatherd shell + core tokens/components; constrained game-theme slot
```

> Naming note: the current `packages/platform/profile` is the seed of `progression`. The roadmap below
> splits it; until then, treat `profile` as `progression`.

## Why a modular monolith (for now)

All contexts run in **one process** today, wired together at the composition root (`apps/server`),
communicating through the **in-process event bus**. This gives us the *logical* decoupling of
microservices with almost none of the operational cost.

The bus lives behind an interface for exactly one reason: when a single consumer needs to scale
independently (say, AI summaries, or analytics volume), we swap the bus transport (in-process →
Redis Streams / NATS / Kafka) and lift that consumer into a worker — **without touching producers or
sibling consumers**. We do not do this until a real bottleneck demands it.

What we are deliberately *not* building yet: separate services, Kafka, a CQRS framework, multi-region
anything. Designed for, not built.

## Integrity rules (non-negotiable, because of strangers + real money)

- All currency and ownership mutations are **server-side, event-sourced, idempotent, and ledgered.**
  The client never asserts a balance or an unlock; it only displays what the server projects.
- Hidden information (roles, unrevealed answers) lives only in server state and is filtered per player
  by `projectView`. The client is never trusted with secrets.
- Events carry a unique id; consumers are idempotent so at-least-once delivery can't double-grant.

## Persistence direction (not built this phase)

- **PostgreSQL** for durable, per-context data (each context owns its schema/tables; no cross-context
  foreign keys — they reference by id and reconcile via events).
- **Redis** for ephemeral/real-time concerns: presence, matchmaking queues, rate limiting, and later
  the event-bus transport + room registry for horizontal scale.
- Live game state stays in memory during a session (authoritative in the engine), with summaries
  persisted at game end.

## Implementation roadmap (sequenced, after each doc is approved)

This phase produces **docs only**. When we resume building, the lean order is:

1. **Manifest + catalog.** Extend `GameDefinition.meta` → `GameManifest`; make `GAME_REGISTRY`
   manifest-driven. Unblocks home browsing and lobby config. (`game-manifest.md`)
2. **Content decoupling.** Move `would-you-rather` prompts out of the module into a content service;
   `setup()` receives resolved items. (`content.md`)
3. **Progression split + rewards.** Split `platform/profile` into `progression` (+ titles,
   achievements) and add the results-screen reward moment. (`progression.md`)
4. **Economy + entitlements.** Wallet, ledger, entitlement checks; gate one premium pack end-to-end.
   (`economy.md`)
5. **Room results phase.** Extend `RoomController` (`lobby → in-game → results → lobby`) for rematch /
   multi-game sessions. (`room-experience.md`)
6. **Identity + social.** Guest→user upgrade, profiles, friends, recent players, parties. (`social.md`)
7. **Design system hardening.** Promote shared components into `packages/ui` with the two-layer token
   model. (`design-language.md`)
8. Later, as warranted: memories, liveops/seasonal, AI services, first-party originals.

Each step is small, shippable, and leaves the 33 existing tests green (plus new ones). We stop and ask
before any step that would significantly shape Gatherd's future (per the working agreement).
