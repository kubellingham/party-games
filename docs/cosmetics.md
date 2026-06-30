# Cosmetics

Self-expression and status: how players make their presence at the table feel like *theirs*. Owned by
the **`platform/cosmetics`** context. Cosmetics are the primary sink for earned coins and a major
driver of paid gems — but they are never pay-to-win (they don't affect game outcomes).

## Cosmetic types

| Type | Where it shows | Notes |
| --- | --- | --- |
| **Avatar** | Player chip, profile, lobby | Base identity image/illustration |
| **Frame** | Around the avatar | Rarity-signaling border |
| **Name color** | Player name everywhere | Must stay within a11y contrast limits |
| **Emote / reaction** | In-room, during/after games | Shared-moment fuel — quick reactions |
| **Room theme** | Lobby/room background | Host's choice, sets the table's vibe |
| **Win animation** | Results screen | The flourish on victory |

All of these render **inside the locked Gatherd shell** (`design-language.md`) — cosmetics personalize
the player, they never alter Gatherd's chrome, navigation, or core components.

## Model

```ts
interface CosmeticDef {
  id: string;                          // "frame_gold"
  type: "avatar" | "frame" | "name_color" | "emote" | "room_theme" | "win_animation";
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  acquisition: "coins" | "gems" | "premium" | "achievement" | "seasonal";
  asset: string;                       // reference into the asset pipeline
  availability?: { from?: number; to?: number };  // limited/seasonal
}

interface Loadout {                    // what a player currently has equipped
  playerId: string;
  avatar?: string;
  frame?: string;
  nameColor?: string;
  emotes: string[];                    // an equipped set, shown as quick-reactions
  roomTheme?: string;
  winAnimation?: string;
}
```

## Ownership vs equipping (the clean split)

- **Ownership** is an **entitlement** (`economy.md`): `cosmetic:frame_gold`. Cosmetics context never
  tracks "who owns what" — it asks `entitlements`.
- **Equipping** is the loadout, owned here. Equipping validates ownership via an entitlements query;
  you can't equip what you don't own.
- **Acquisition** flows through SKUs/purchases or reward events; `entitlement.granted` is what makes a
  cosmetic available to equip.

This separation means a cosmetic can be granted by a purchase, an achievement, Premium, or a seasonal
reward — all the same to the cosmetics context.

## Rarity & sources

- **Common/rare** lean coin-earned (the play economy's sink).
- **Epic/legendary** lean gem/premium/seasonal (the paid + prestige economy).
- **Achievement** cosmetics are unbuyable prestige — they signal *what you did*, not *what you paid*.
  These matter most to the vision: they are memory made wearable.

## Events

**Consumes:** `entitlement.granted` (a cosmetic became available), `entitlement.expired` (seasonal
cosmetic lapsed → unequip if needed).

**Emits:** `cosmetic.equipped`, `cosmetic.unequipped` (so profiles/rooms refresh; analytics can learn
what's popular).

## Open questions (→ `open-questions.md`)

- Do emotes/reactions need rate-limiting or host mute? (anti-griefing in stranger rooms)
- Can room themes be set only by the host, or voted on by the room?
- Trading/gifting cosmetics — in scope ever? (large economy + safety implications → ask before building)

## Build-now vs later

- **Now (when implementation resumes):** avatar + frame + name color, equipped via loadout, owned via
  entitlements; one earned (coins) and one premium (gems) example.
- **Later:** emotes, room themes, win animations, rarity tiers, seasonal cosmetics.
