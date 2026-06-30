# Game Metadata Standard (the Game Manifest)

The contract every game declares so the platform can list, filter, route, theme, and configure it
**without knowing anything about how it plays.** This is what makes "dozens of games on one platform"
tractable — the platform reasons about manifests, not game internals. Owned by **`platform/catalog`**
(the registry + query API); the schema lives in **`packages/contracts`**.

## Where it comes from

Today `GameDefinition` (in `packages/engine/src/types.ts`) has a minimal `meta`:

```ts
meta: { name: string; minPlayers: number; maxPlayers: number }
```

We extend this to a full **`GameManifest`**. The engine stays game-logic-only; the manifest is the
game's public description. `GAME_REGISTRY` (in `apps/server/src/game-registry.ts`) becomes
**manifest-driven**: registering a game validates its manifest and exposes it to the catalog.

## The manifest

```ts
interface GameManifest {
  id: string;                          // "would-you-rather"
  name: string;                        // "Would You Rather"
  tagline: string;                     // one-liner for cards
  description: string;                 // longer, for the game's detail view

  categories: string[];                // "Icebreaker", "Trivia", "Social Deduction"
  tags: string[];                      // free-form discovery tags

  minPlayers: number;
  maxPlayers: number;
  recommendedPlayers: { min: number; max: number };

  estimatedDurationMin: number;        // for "got 10 minutes?" filtering
  ageRating: AgeRating;                // gates spicy/adult games
  locales: string[];                   // languages the game UI supports

  assets: { thumbnail: string; icon: string; hero?: string };

  contentPackable: boolean;            // does it consume content packs? (content.md)
  supportsTeams: boolean;
  supportsSpectators: boolean;
  hiddenInfo: boolean;                 // does it rely on projectView secrecy? (Mafia/Spy)

  engineVersion: string;               // compatibility: which engine contract it targets
  entitlement: "free" | "premium";     // is the game itself gated?

  lobbyConfigSchema: ZodType;          // options shown in the lobby (rounds, difficulty, …)
  theme: GameTheme;                    // constrained accent/artwork surface (design-language.md)
}
```

### Notes on key fields

- **`recommendedPlayers`** vs min/max: a game may *allow* 3–12 but *shine* at 5–8. Matchmaking and the
  lobby use the recommendation; the hard limits are min/max.
- **`hiddenInfo`** tells the platform (and reviewers) this game leans on `projectView` secrecy — a flag
  for matchmaking, spectator rules, and testing rigor.
- **`engineVersion`** is forward-insurance: when the engine contract evolves, the catalog can refuse or
  flag incompatible games instead of crashing at runtime.
- **`lobbyConfigSchema`** is a zod schema so the lobby can **render config UI generically** and the
  server can **validate** host choices — no per-game lobby code.
- **`theme`** is the *only* visual surface a game controls (accent + artwork). See below.

## The constrained theme surface

Per `design-language.md`, a game may vary **accent color and artwork — nothing else.**

```ts
interface GameTheme {
  accent: string;                      // primary accent (validated for a11y contrast)
  accentSecondary?: string;
  artwork?: { background?: string; illustration?: string };
}
```

The manifest type **cannot express** overrides to typography, spacing, navigation, or core components.
Off-brand is therefore unrepresentable at the type level — the platform renders every game inside the
locked Gatherd shell and only injects this accent/artwork.

## Validation & registration

- The manifest schema (zod) lives in `packages/contracts`.
- On registration, the catalog **validates** the manifest (including `theme.accent` contrast) and
  rejects invalid games — a bad manifest never reaches players.
- The catalog exposes a **query API**: `listGames(filters)`, `getManifest(id)`. Home browsing, lobby
  config, and matchmaking filters all read from here.

## Who consumes the manifest

| Consumer | Uses |
| --- | --- |
| Home / library (`home-and-navigation.md`) | name, tagline, categories, tags, assets, duration, players |
| Lobby (`room-experience.md`) | min/max/recommended players, `lobbyConfigSchema`, `contentPackable` |
| Matchmaking (later) | categories, recommended players, `hiddenInfo`, locale |
| Design system | `theme` (accent/artwork) injected into the locked shell |
| Entitlements (`economy.md`) | `entitlement` (is the game gated) |

## Events

The catalog is mostly a registry (read-heavy). It emits `catalog.game_registered` /
`catalog.game_updated` so caches and home feeds refresh.

## Open questions (→ `open-questions.md`)

- Shared category taxonomy — fixed enum vs free-form + curation?
- Do we ever support **external/third-party** games, which would make manifest validation a security
  boundary? (**ask before building** — large architectural implication.)

## Build-now vs later

- **Now (when implementation resumes):** define the manifest schema in `contracts`, migrate WYR's
  `meta` to a manifest, make `GAME_REGISTRY` manifest-driven, expose `listGames`/`getManifest`.
- **Later:** generic lobby-config rendering from `lobbyConfigSchema`, matchmaking filters,
  engineVersion compatibility enforcement.
