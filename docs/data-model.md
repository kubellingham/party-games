# Data Model

The consolidated entity list and — critically — **which context owns each entity.** The ownership rule:
every entity is owned by exactly one context; other contexts reference it by id and reconcile via events
(no shared tables, no cross-context foreign keys). This is the data side of the dependency rule in
`architecture.md`.

## Ownership map

| Entity | Owning context | Notes |
| --- | --- | --- |
| `Account` | identity | login/auth; guest or registered |
| `PublicProfile` | identity | composes reads from progression/cosmetics/memories |
| `PlayerProgress` (xp, level, titles, achievements) | progression | derived level; achievement progress |
| `AchievementDef` | progression | data-defined rules |
| `Wallet` (coins, gems) | economy | **projection** of the ledger |
| `LedgerEntry` | economy | source of truth for balances; idempotent by `sourceEventId` |
| `Entitlement` | entitlements | ownership of packs/cosmetics/premium; time-bounded supported |
| `SKU` | economy | catalogue of buyable things |
| `CosmeticDef` | cosmetics | definitions/rarity/acquisition |
| `Loadout` | cosmetics | equipped items; validates ownership via entitlements |
| `GameManifest` | catalog | metadata + constrained theme; validated on registration |
| `ContentPack` / `ContentItem` | content | item shape validated per game; versioned/immutable when published |
| `Friendship` | social | request/accept; presence is separate/ephemeral |
| `RecentPlayer` | social | event-sourced from shared rooms; decayed |
| `Party` | social | persistent group + leader |
| `Report` / `Block` | social | safety |
| `Presence` | social | ephemeral (Redis later) |
| `Memory` / `MemoryTimeline` | memories | event-sourced; shared-only visibility |
| `LiveEvent` (season) | liveops | scheduling object; activates ids in other contexts |
| `Room` (live) | apps/server (room) | in-memory during a session; emits facts |
| game state `S` | engine (in session) | authoritative; never shipped raw to clients |

## Identifiers

- `playerId` is the cross-context key (a player's stable id; guest or account). Branded in
  `packages/contracts` (`PlayerId`).
- `roomId` (the join code) and `gameId` (game type, e.g. `"would-you-rather"`) are the other shared keys,
  already in `contracts`.
- `sku`, `packId`, `cosmeticId`, `achievementId`, `eventId` are owned by their respective contexts.

Contexts store only their own entities plus **foreign ids**. Example: `Loadout.frame` holds a
`cosmeticId`; cosmetics asks entitlements "does `playerId` own `cosmetic:frame_gold`?" — it never reads an
entitlements table directly; it calls the query API.

## Read models (cross-context composition)

Some screens need data from several contexts. They compose via **query APIs**, not joins:

- **Player chip / profile** = identity (name/handle) + cosmetics (loadout) + progression (level/title) +
  memories (showcase). Composed at the edge (UI/BFF), each piece from one context.
- **Results reward summary** = progression (xp/level/achievements) + economy (coins) — see
  `progression.md`.
- **Home modules** = catalog + social + progression + economy + content/liveops — each module, one
  context (`home-and-navigation.md`).

## Persistence direction (not built this phase)

- **PostgreSQL:** one logical schema per context; no cross-schema FKs. Ledger/entitlements/memories are
  append-friendly. Published content is versioned.
- **Redis:** presence, matchmaking, rate limits; later the bus transport + room registry.
- **In-memory:** live room + game state during a session; summaries persisted at game end.

## Integrity invariants

- A `Wallet` always equals the sum of its `LedgerEntry`s (rebuildable).
- One `LedgerEntry` / `Entitlement` per `sourceEventId` (idempotent grants).
- A `Loadout` only references owned cosmetics (validated against entitlements).
- A shared `Memory` is visible only to its `participants`.
- Game state `S` is never serialized to a client; only `projectView(S, player)` is.

## Open questions (→ `open-questions.md`)

- Handle uniqueness + identity model (affects `Account`/`PublicProfile`).
- Memory retention/storage policy at scale.
- Whether any entity needs cross-region replication early (assume no).
