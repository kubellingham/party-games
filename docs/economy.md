# Economy & Entitlements

The money and ownership layer: two currencies, a transaction ledger, what players own, and Gatherd
Premium. Spans two closely-related contexts — **`platform/economy`** (balances + transactions) and
**`platform/entitlements`** (ownership). Kept conceptually distinct because "how much you have" and
"what you own" have different lifecycles.

> Integrity first: every mutation here is **server-side, event-sourced, idempotent, and ledgered**.
> The client displays projections; it never asserts a balance or an unlock. This matters because we
> have stranger play and (with Premium/gems) real money.

## Monetization model (assumed: Hybrid — confirm in `open-questions.md`)

- **Gatherd Premium** — a subscription (recurring revenue).
- **Premium content packs / cosmetics** — one-time purchases.
- **Two currencies:**
  - **Coins** — *soft* currency, **earned** by playing, leveling, achievements, daily streaks. Spent on
    most cosmetics and some content.
  - **Gems** — *hard* currency, **purchased** with money (or granted by Premium). Spent on premium
    cosmetics, premium packs, gem-exclusive items.
- **Currency rules:** gems never convert back to money; coins never buy gems. Money → gems → premium
  goods; play → coins → standard goods. This keeps the earned economy and the paid economy from
  contaminating each other.

## Wallet & ledger (`platform/economy`)

The **ledger is the source of truth**; balances are a projection (sum of entries). This gives us
auditability, refunds, and idempotency for free.

```ts
interface LedgerEntry {
  id: string;
  playerId: string;
  currency: "coins" | "gems";
  delta: number;              // +grant / -spend
  reason: string;             // "game.participation", "purchase:pack_halloween", "premium.grant"
  sourceEventId: string;      // idempotency key — one ledger entry per source event
  createdAt: number;
}

interface Wallet { playerId: string; coins: number; gems: number; } // projection of the ledger
```

- **Grants** come from events (progression rewards, daily, seasonal). One ledger entry per
  `sourceEventId`; a replayed event is a no-op.
- **Spends** are commands (purchase X) validated against the projected balance, then written as a
  negative entry inside a transaction. Insufficient funds → rejected, nothing written.
- Gem purchases (money → gems) are recorded as grants with a payment reference; the payment provider
  integration is out of scope for now but the ledger shape anticipates it.

## Entitlements (`platform/entitlements`)

What a player *owns*. Ownership is a fact, separate from the currency spent to get it.

```ts
interface Entitlement {
  playerId: string;
  sku: string;               // "pack:trivia_90s", "cosmetic:frame_gold", "premium"
  source: "purchase" | "reward" | "premium" | "promo" | "seasonal";
  grantedAt: number;
  expiresAt?: number;        // for time-bounded entitlements (Premium, seasonal)
}
```

- **Ownership checks** gate content (`content.md`) and cosmetics (`cosmetics.md`): "can this player use
  pack X / equip cosmetic Y?" is an entitlements query.
- Entitlements are granted by events too (`purchase.completed`, `achievement.unlocked` with a cosmetic
  reward, `season.reward_granted`) — so the same idempotent, event-sourced discipline applies.

## SKUs (the catalogue of buyable things)

A unified `SKU` describes anything acquirable, decoupling "what it costs" from "what it is":

```ts
interface SKU {
  id: string;                          // "pack:trivia_90s"
  kind: "content_pack" | "cosmetic" | "premium" | "gem_bundle" | "title";
  price: { coins?: number; gems?: number; money?: { usd: number } };
  grants: string[];                    // entitlement skus this purchase confers
  availability?: { from?: number; to?: number };  // for seasonal/limited SKUs
}
```

This lets seasonal/limited offers (`seasonal-events.md`) and gem bundles reuse one purchase pipeline.

## Gatherd Premium

Modeled as a **time-bounded entitlement** (`sku: "premium"`, `expiresAt`). Perks resolve by checking
that entitlement at the relevant moment:

- XP / coin **multiplier** (applied at award time in progression/economy, not pre-baked).
- Access to **premium packs/cosmetics** without separate purchase (entitlement check resolves true).
- **Larger parties**, ad-free, early access to new games / seasonal content.

Because Premium is just an entitlement, the rest of the platform needs no special "is premium" plumbing
— it asks entitlements, same as for any pack.

## Events

**Consumes:** `progression.xp_awarded`/`achievement.unlocked` (reward fields → coin grants),
`purchase.completed`, `season.reward_granted`, `day.tick` (daily coins).

**Emits:** `economy.coins_granted`, `economy.gems_granted`, `economy.balance_spent`,
`entitlement.granted`, `entitlement.expired`. (See `events.md`.)

## Open questions (→ `open-questions.md`)

- Premium price point and the exact perk list; what is Premium-only vs à-la-carte.
- Real-money payment provider + regional/tax/compliance constraints (and minors + real money).
- Do gems ever drop from play (rarely), or are they strictly paid?
- Refund / chargeback policy and how it reconciles against the ledger.

## Build-now vs later

- **Now (when implementation resumes):** coins ledger + balance, entitlement records + checks, gate
  **one** premium content pack end-to-end to prove the pipeline.
- **Later:** gems, real-money purchases, Premium subscription, gem bundles, seasonal SKUs.
