# Content Architecture

The data games consume — trivia questions, Would You Rather prompts, Never Have I Ever statements, spy
locations, and so on. Owned by the **`platform/content`** context. Getting this right is what lets one
game ship dozens of packs and lets us add AI-generated and (later) player-generated content safely.

## The core principle: content is not code

Today `would-you-rather` hardcodes `DEFAULT_PROMPTS` inside the module. That was fine for a vertical
slice; it does not scale. **Content must live outside game modules**, behind a content service, so:

- new packs ship without code releases,
- the same game supports many themed/localized packs,
- packs can be free, earned, or premium,
- AI and a CMS can produce content into the same pipeline.

**Refactor (roadmap step 2):** move WYR prompts into content; a game's `setup()` receives *resolved
items* chosen in the lobby. Games stay content-agnostic — they know the *shape* of an item, never where
it came from.

## Model

```ts
interface ContentPack {
  id: string;                          // "wyr_classic", "trivia_90s_movies"
  gameId: string;                      // which game consumes it
  name: string;
  description: string;
  category: string;                    // "Movies", "Spicy", "Family" …
  tags: string[];
  locale: string;                      // "en", "en-GB", "es" …
  ageRating: AgeRating;                // gates spicy/adult packs
  visibility: "free" | "coins" | "gems" | "premium";   // how it's acquired
  authorship: "official" | "ai" | "ugc";
  status: "draft" | "in_review" | "published" | "archived";
  itemCount: number;
}

// Item shape is game-specific and validated by a per-game zod schema the game registers.
// e.g. WYR item: { a: string; b: string }   trivia item: { q, choices[], answerIndex }
type ContentItem = unknown; // validated against the owning game's item schema
```

A pack belongs to exactly one game; its items conform to that game's **item schema** (declared by the
game alongside its manifest — see `game-manifest.md`, `contentPackable`).

## Categories & discovery

Packs carry `category` + `tags` so the home/library and lobby can filter ("Trivia → 90s → Movies",
"Family-friendly only"). Categories are shared vocabulary across games where it makes sense.

## CMS readiness

We are **not** building a CMS now, but we design so one drops in:

- Packs/items persist in **Postgres**, owned by the content context, exposed via a **query API**
  (`getPacks(gameId, filters)`, `resolveItems(packIds, count, seed)`).
- Authoring is just another writer into the same `draft → in_review → published` pipeline. A future
  internal tool, an API, or AI all use the same path.
- Versioning: published packs are immutable; edits create a new version (so live games aren't disrupted
  and analytics stay coherent).

## AI-generated content (pipeline, not magic)

AI is a **producer into the normal pipeline**, never a bypass of review:

```
generate (Claude API) ──▶ draft pack ──▶ automated moderation ──▶ human review ──▶ published
   model: claude-opus-4-8 / claude-sonnet-5     (safety filter)     (gate, see open Q)
```

- Generation prompts are templated per game + category + tone; output validated against the game's item
  schema before becoming a draft.
- Provenance (`authorship: "ai"`) is retained for transparency and analytics.
- See `ai-vision.md` for the broader AI architecture. Nothing here is built now — the pipeline stages
  are designed so the AI step is one stage among several.

## Premium & earned packs

`visibility` maps to acquisition via SKUs/entitlements (`economy.md`):

- `free` — always available.
- `coins` — purchasable with earned currency.
- `gems` / `premium` — paid, or included with Gatherd Premium.

The content service answers "can this player use this pack?" by querying `entitlements`. It never
decides pricing — that's economy/SKUs.

## Moderation

Every non-official pack (AI or UGC) passes a **moderation gate** before `published`:

- automated checks (safety classifier, banned-terms, age-rating consistency),
- human review where required (policy in `open-questions.md`),
- report-driven re-review post-publish (ties to `social.md` safety + future `ai` moderation assist).

## Engine integration (how a game gets its content)

1. Lobby shows packs for the chosen game (content query, filtered by entitlement + age + locale).
2. Host selects pack(s) + round count.
3. On start, the room asks content to **resolve items** (`resolveItems(packIds, count, seed)` — seeded
   for reproducibility/fairness).
4. Resolved items are passed into the game's `setup()`. The game shuffles/uses them; it never imports
   content.

## Events

**Consumes:** `pack.published` (warm caches), `entitlement.granted` (a player gained a pack).

**Emits:** `content.pack_published`, `content.pack_used` (which packs are actually played — feeds
analytics, recommendations, and seasonal planning).

## Open questions (→ `open-questions.md`)

- Is **UGC** (player-authored packs) in scope soon? It multiplies moderation cost and safety surface —
  **ask before building.**
- AI content: is human-in-the-loop review mandatory before publish, and at what volume?
- Localization depth at launch (which locales), and do we machine-translate or author per-locale?

## Build-now vs later

- **Now (when implementation resumes):** content service + Postgres-backed packs/items, item-schema
  validation per game, `resolveItems`, and the WYR decoupling. One free pack + one premium pack.
- **Later:** categories UI, AI pipeline, UGC, localization, versioning tooling, CMS.
