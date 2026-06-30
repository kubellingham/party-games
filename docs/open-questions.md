# Open Questions (for Product / PM)

Decisions that are **product calls, not engineering calls** — consolidated from every design doc so they
can be answered in one pass. Per the working agreement, anything marked **⚠ ask-before-build** could
significantly shape Gatherd's future and must be discussed before implementation.

Each entry notes where it bites and a recommended default (mine, as Lead Engineer) where I have one.

## Monetization & economy
1. **Premium price + perk list** — what exactly is Premium-only vs à-la-carte? *(economy.md)*
   _Rec: Premium = multipliers + premium packs/cosmetics included + larger parties + early access; keep
   individual packs/cosmetics also buyable à-la-carte._
2. **Real-money payments** — provider, regional/tax/compliance, and **minors + real money**. ⚠ *(economy.md)*
3. **Gems** — strictly paid, or rare play drops? *(economy.md)* _Rec: strictly paid; coins are the play
   reward._
4. **Refund/chargeback policy** vs the ledger. *(economy.md)*
5. **Purchasable titles?** or always earned? *(progression.md)* _Rec: earned-only at launch (prestige)._
6. **Do achievements ever award gems?** *(progression.md)* _Rec: no — coins/cosmetics/XP only._

## Content
7. **UGC (player-authored packs)** — in scope soon? Multiplies moderation/safety surface. ⚠ *(content.md)*
   _Rec: not at launch; official + AI (reviewed) first._
8. **AI content review** — human-in-the-loop mandatory before publish, and at what volume? ⚠ *(content.md,
   ai-vision.md)* _Rec: human review required initially._
9. **Localization** — which locales at launch; machine-translate vs author per-locale? *(content.md)*

## Identity, social & safety
10. **Handles** — globally unique handles vs display-name + discriminator? *(social.md, data-model.md)*
11. **Text chat** (room and/or party) at launch? Major safety/moderation surface. ⚠ *(room-experience.md,
    social.md)* _Rec: defer; rely on external voice/video for now._
12. **Age policy** — minimum age; how social + real-money interact with minors (compliance). ⚠ *(social.md)*
13. **Guest→account upgrade aggressiveness** — how hard do we push, what's the min friction? *(ux-flows.md)*
14. **Limits** — friend cap, recent-player retention window, party size (+ Premium party perk). *(social.md)*

## Product scope / sequencing
15. **Quick Play / public matchmaking** at launch, or private rooms first? *(ux-flows.md,
    home-and-navigation.md)* _Rec: private rooms first; matchmaking after the core loop._
16. **Default Home module ordering** — validate with early users. *(home-and-navigation.md)*
17. **Spectators** for hidden-info games — can they see secrets? *(room-experience.md)*

## Design / brand
18. **Brand specifics** — final palette, typeface, logo, mascot/world. *(design-language.md,
    first-party-games.md)* _Rec: I propose a starter system; PM refines._
19. **Light theme** at launch or dark-first only? *(design-language.md)* _Rec: dark-first only at launch._

## Memories, seasonal, AI (later systems, early hooks)
20. **Highlight events** — should games declare which domain events are "highlights" (for memories/AI)?
    Small contract addition, cheap now. *(memories.md, events.md, ai-vision.md)* _Rec: yes, add the flag._
21. **`day.tick` system pulse** — confirm we add a scheduled daily event (streaks/anniversaries/expiry).
    *(events.md)* _Rec: yes._
22. **Memory retention** — do memories live forever? storage + privacy at scale. *(memories.md)*
23. **Seasonal exclusivity** — rewards exclusive-forever (FOMO) vs returning yearly? *(seasonal-events.md)*
24. **First AI investment** — likely content generation; confirm when the time comes. ⚠ *(ai-vision.md)*

## First-party games (strategy)
25. **First original concept + timing** (after core + a few classics). ⚠ *(first-party-games.md)*
26. **Recurring mascot/world** spanning games + cosmetics? *(first-party-games.md)*
27. **External/third-party games** ever? Would make manifest validation a security boundary. ⚠
    *(game-manifest.md)* _Rec: first-party + curated only; no open third-party at launch._

## How to use this list

- Items **without ⚠** have a recommended default; if you're happy with the default, we proceed and you
  needn't decide now.
- Items **with ⚠** should be discussed (with the PM) before the related work starts — a short conversation
  now beats a refactor later.
