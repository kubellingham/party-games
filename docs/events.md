# Event Taxonomy

The event bus is Gatherd's backbone (`architecture.md`). This doc catalogs the events contexts publish
and subscribe to — the **contract** that keeps producers and consumers decoupled. Every event travels in
the versioned **envelope** already defined in `packages/contracts`.

## The envelope (already built)

```ts
interface EventEnvelope<T = unknown> {
  id: string;                 // unique — consumers dedupe/idempotency key
  type: string;               // dot-namespaced discriminator, e.g. "economy.coins_granted"
  version: number;            // payload schema version for this type
  occurredAt: number;         // epoch ms (server clock)
  sequence: number;           // per-room monotonic ordering
  source: { roomId: string; gameId: string };
  players: string[];          // subjects/recipients
  payload: T;                 // validated per-type by the owning context
}
```

Rules: consumers **must tolerate unknown types**; payloads are validated by the owning context (not
centrally); breaking payload changes **bump `version`** and add a migration note here.

## Canonical lifecycle events (built, emitted for every game)

These already exist in `packages/contracts/src/events.ts` and require zero per-game code:

| Type | Payload | Emitted when |
| --- | --- | --- |
| `game.started` | `{ playerCount }` | a game begins |
| `game.turn_started` | `{ turn, activePlayers }` | a new turn/round begins |
| `game.finished` | `{ reason: "completed" \| "aborted" }` | a game ends |
| `game.scores_finalized` | `{ scores: Record<playerId, number> }` | final scores known |

Progression + analytics already consume these. **They are the foundation the platform events below build
on.**

## Game-specific events

Games may emit namespaced domain events (e.g. `wyr.answered`, `wyr.round_revealed`) via their reducer;
the engine runtime wraps them in envelopes. Platform contexts ignore types they don't model (analytics
captures all). **Proposed addition (decide early): a game may flag certain domain events as
`highlight: true`** so `memories.md` / future AI can find standout moments without hardcoding per game.

## Platform event taxonomy (to add as contexts are built)

Namespaced by context. Payloads are sketches; finalized with each context's implementation.

### progression
| Type | Payload (sketch) |
| --- | --- |
| `progression.xp_awarded` | `{ playerId, amount, reason }` |
| `progression.leveled_up` | `{ playerId, newLevel }` |
| `achievement.unlocked` | `{ playerId, achievementId, reward? }` |
| `progression.title_unlocked` | `{ playerId, titleId }` |

### economy / entitlements
| Type | Payload (sketch) |
| --- | --- |
| `economy.coins_granted` | `{ playerId, amount, sourceEventId, reason }` |
| `economy.gems_granted` | `{ playerId, amount, sourceEventId }` |
| `economy.balance_spent` | `{ playerId, currency, amount, sku }` |
| `purchase.completed` | `{ playerId, sku, payment? }` |
| `entitlement.granted` | `{ playerId, sku, source, expiresAt? }` |
| `entitlement.expired` | `{ playerId, sku }` |

### cosmetics
| Type | Payload (sketch) |
| --- | --- |
| `cosmetic.equipped` | `{ playerId, type, cosmeticId }` |
| `cosmetic.unequipped` | `{ playerId, type }` |

### catalog / content
| Type | Payload (sketch) |
| --- | --- |
| `catalog.game_registered` | `{ gameId, version }` |
| `content.pack_published` | `{ packId, gameId, version }` |
| `content.pack_used` | `{ packId, gameId, roomId }` |

### room (from apps/server)
| Type | Payload (sketch) |
| --- | --- |
| `room.created` | `{ roomId, hostId, gameId? }` |
| `room.player_joined` | `{ roomId, playerId }` |
| `room.player_left` | `{ roomId, playerId }` |

### social
| Type | Payload (sketch) |
| --- | --- |
| `social.friend_added` | `{ playerId, friendId }` |
| `social.friend_removed` | `{ playerId, friendId }` |
| `social.party_created` | `{ partyId, leaderId }` |
| `social.player_reported` | `{ reporterId, targetId, reason, ref? }` |
| `social.player_blocked` | `{ playerId, targetId }` |
| `presence.changed` | `{ playerId, status }` (ephemeral; may bypass durable bus) |

### memories / liveops
| Type | Payload (sketch) |
| --- | --- |
| `memory.created` | `{ memoryId, kind, participants }` |
| `memory.anniversary_due` | `{ timelineKey, participants, kind }` |
| `season.started` / `season.ended` | `{ eventId }` |
| `season.reward_granted` | `{ playerId, eventId, reward }` |
| `season.challenge_completed` | `{ playerId, eventId, challengeId }` |

### system
| Type | Payload | Notes |
| --- | --- | --- |
| `day.tick` | `{ date }` | a scheduled daily pulse driving streaks, anniversaries, expiries |

## Consumer/producer matrix (who cares about what)

| Event family | Key consumers |
| --- | --- |
| `game.*` lifecycle | progression, economy(via rewards), memories, analytics |
| game `highlight` events | memories, (future) ai |
| `room.*` | social (recent players), memories, analytics |
| `progression.*` / `achievement.*` | economy (coin rewards), cosmetics (unlocks), profile read model |
| `entitlement.*` | cosmetics, content (availability), profile |
| `season.*` | content, economy, cosmetics, progression, home |
| `day.tick` | progression (streaks), economy (daily), memories (anniversaries), entitlements (expiry) |

## Versioning & evolution

- Additive fields: no version bump (consumers ignore unknown fields).
- Breaking changes: bump `version`, support old + new during transition, note migration here.
- New event types are always safe to add (unknown-tolerant consumers).

## Build-now vs later

- **Built:** the canonical `game.*` lifecycle + envelope + game-specific events.
- **Add with each context:** the platform events above, as that context is implemented.
- **Decide early (small contract additions):** `highlight: true` on game events, and the `day.tick`
  system pulse — both are cheap now and unblock memories/seasonal/AI later.
