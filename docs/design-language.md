# Gatherd Design Language

The system that lets **dozens of games share one identity.** Navigation, typography, spacing,
interactions, and core components are constant across every game; only **accent color and artwork** vary
per game. This is enforced by structure (a two-layer token system + a locked shell), not by convention
or code review. Lives in **`packages/ui`**.

> Design intent (founder): *Individual games may have their own accent colors or artwork, but
> navigation, typography, spacing, interactions, and core components should always feel unmistakably
> like Gatherd.*

## Two layers

### Layer 1 — Gatherd Core (locked)

The immutable foundation every screen and every game inherits. Games **cannot** touch it.

- **Design tokens:** color system (brand + semantic), type scale, spacing scale, radius, elevation,
  motion/easing/durations.
- **The shell:** bottom navigation, headers, page chrome, modal/sheet behavior, toast/reward
  presentation, loading/empty/error states.
- **Core components:** buttons, inputs, cards, lists, player chips, avatars + frames, badges, timers,
  scoreboards, reward toasts, dialogs.

These are exported from `packages/ui` and consumed by the web app and by every game's UI. There is one
implementation; games compose it.

### Layer 2 — Per-game theme (the entire creative budget)

A game declares only:

```ts
interface GameTheme {
  accent: string;                 // primary accent — validated for contrast against core surfaces
  accentSecondary?: string;
  artwork?: { background?: string; illustration?: string };
}
```

That is the **whole** theming surface. It lives in the game's manifest (`game-manifest.md`). There is no
field for type, spacing, nav, or component overrides — so "off-brand" is **unrepresentable**, not merely
discouraged.

## How enforcement actually works

- Core components read **only Layer-1 tokens** plus a single **semantic accent slot** (`--accent`) that
  Layer-2 fills. A game can change what `--accent` resolves to; it cannot introduce new component styles.
- A game is always rendered **inside the Gatherd shell** (nav, headers, chrome) which the game never
  controls — it gets a content area + the accent/artwork slots.
- The theme value is validated (e.g. `accent` must pass contrast against core surfaces) at manifest
  registration (`game-manifest.md`), so an inaccessible or jarring accent never ships.
- Because the contract is *types + a token slot*, the guarantee holds for game #2 and game #40 with no
  extra effort — which is the whole point.

```
        Gatherd shell (locked: nav, headers, chrome, components, tokens)
        ┌───────────────────────────────────────────────────────────┐
        │  header                                              level  │
        │  ┌─────────────────────────────────────────────────────┐  │
        │  │   GAME CONTENT AREA                                   │  │
        │  │   - uses core components                             │  │
        │  │   - tinted by game.theme.accent / artwork  ◀── Layer 2│  │
        │  └─────────────────────────────────────────────────────┘  │
        │  [ Home   Play   Social   Shop   Profile ]  ◀── locked nav  │
        └───────────────────────────────────────────────────────────┘
```

## Tokens (illustrative; final values tuned with brand)

```ts
// packages/ui/tokens.ts
export const tokens = {
  color: {
    // brand + neutrals (dark-first)
    bg: "#0f172a", surface: "#1e293b", surfaceAlt: "#273449",
    text: "#e2e8f0", textMuted: "#94a3b8",
    // semantic
    success: "#4ade80", danger: "#f87171", warning: "#fbbf24",
    // the single slot Layer-2 fills:
    accent: "var(--accent, #6366f1)",   // default Gatherd indigo if a game sets nothing
  },
  type: { /* scale: display / h1 / h2 / body / caption + one font family */ },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },   // 4px base grid
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  motion: { fast: 120, base: 200, slow: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
};
```

The current `apps/web/src/styles.css` is the seed of these tokens; they get promoted into `packages/ui`
and consumed everywhere (roadmap step 7).

## Component inventory (Layer 1)

Buttons (primary/secondary/ghost) · inputs/fields · cards · lists/rows · **player chip** (avatar +
frame + name color + title + level) · avatars & frames · badges/tags · **timer** · **scoreboard** ·
**reward toast** · dialog/sheet · nav bar · header · loading/empty/error. Games assemble screens from
these; they don't ship their own button.

## Interaction & motion

Consistent everywhere: tap feedback, transitions, the reward/level-up animation language, toast timing.
A win animation cosmetic (`cosmetics.md`) plays *within* this language, not outside it.

## Tone of voice

Playful, warm, inclusive, never snarky at the player's expense. Copy celebrates the group. Microcopy
guidelines live with the components so text feels Gatherd too.

## Accessibility

- Contrast checked against core surfaces **including arbitrary game accents** (validated at registration).
- Minimum touch targets (44px), thumb-zone nav, one-handed use.
- Full **reduced-motion** support; never rely on color alone (icons/text accompany state).

## Open questions (→ `open-questions.md`)

- Brand specifics: final palette, typeface, logo, mascot? (assumed: propose from scratch, PM refines.)
- Do we want a light theme at launch or dark-first only?
- Is artwork (Layer 2) ever animated/illustrative-heavy enough to need an asset-performance budget?

## Build-now vs later

- **Now (when implementation resumes):** promote tokens + the core components currently in
  `apps/web` into `packages/ui`; wire the `--accent` slot + shell; validate `theme.accent` in the
  manifest.
- **Later:** full component library, motion system, light theme, richer artwork slots, Figma mirror of
  the tokens.
