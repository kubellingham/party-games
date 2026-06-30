# First-Party Games Strategy

Gatherd's long-term strategy is **not only to host classic party games, but to create original
first-party games** that become part of Gatherd's brand identity. This doc records that intent and — more
importantly — confirms it costs **no special architecture**.

## Why first-party games

- **Differentiation:** anyone can ship Trivia. A beloved *original* that only exists on Gatherd is a
  reason to choose Gatherd — and can't be copied away.
- **Brand identity:** a flagship original (with its own characters/world) becomes synonymous with
  Gatherd, the way a signature title defines a platform.
- **Moments, by design:** we can craft originals specifically around the vision — games engineered to
  produce shared laughter and memories, not just competition.
- **Economics:** first-party games carry no licensing cost and give us full control over content,
  seasonal tie-ins, and monetization.

## The key architectural fact: a first-party game is just a game module

A Gatherd original satisfies the **exact same contracts** as any other game:

- a `GameDefinition` (rules, `projectView`, events) — `packages/engine`,
- a `GameManifest` (metadata + constrained theme) — `game-manifest.md`,
- content via the content service if `contentPackable` — `content.md`,
- the locked Gatherd shell + Layer-2 theme — `design-language.md`.

So the platform treats **first-party and classic games uniformly**. The brand bet requires no parallel
engine, no special-casing, no separate pipeline. This is the payoff of the modular architecture: betting
on originals is a *content/design* investment, not an *engineering re-architecture*.

> Implication for now: keep the game contracts clean and expressive enough that an ambitious original
> isn't blocked by them. Phase-2 hardening (adding deliberately different games like a timed/scored game
> and a hidden-role game) is partly insurance that the contract can carry originals later.

## How originals get the spotlight (using existing seams)

- **Featured on Home** via `home-and-navigation.md` modules (`new_game` / `featured`).
- **Seasonal tie-ins** via `liveops` (`seasonal-events.md`) — an original can anchor a season.
- **Brand cosmetics & memories** — characters/worlds become avatars, frames, win animations
  (`cosmetics.md`) and recurring memory milestones (`memories.md`).
- **Entitlement flexibility** — an original can be free (acquisition), Premium-included, or a flagship
  draw, via the manifest `entitlement` + `economy.md`.

## What an original *might* need from the engine (watch list)

Originals tend to push further than ports. Likely future contract needs (decide when a concrete original
is designed — **ask before building**):

- richer turn/phase structures and team play,
- real-time/simultaneous mechanics beyond the current model,
- richer per-player view payloads / spectator modes,
- bespoke art/animation hooks (still within the Layer-2 budget).

These are noted so the engine evolves deliberately toward supporting originals, not as work to do now.

## IP & identity considerations

- Original characters/worlds are Gatherd IP — name, art, and tone should be coherent with the design
  language and tone of voice (`design-language.md`).
- Brand/IP decisions (mascot, flagship concept) are **product/founder + PM** calls, captured in
  `open-questions.md`.

## Open questions (→ `open-questions.md`)

- What is the **first** original concept, and when (after the platform core + a few classics)?
- Does Gatherd want a recurring **mascot/world** that spans games and cosmetics?
- Originals as the primary monetization driver vs classics-as-funnel?

## Build-now vs later

**Strategy doc, nothing to build.** The action item it implies is purely a *constraint on current work*:
keep `GameDefinition` / `GameManifest` general and expressive (validated by Phase-2's deliberately
different games), so the eventual first-party originals are a content/design effort, not an engine
rewrite.
