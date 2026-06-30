# 0001 — Team structure & collaboration model

- **Status:** accepted
- **Date:** 2026-06-30
- **Deciders:** Founder, Lead Engineer

## Context

Gatherd was previously built with an external PM/architect ("Julie", a ChatGPT chat). The Founder has
removed Julie and is bringing in a **new Claude chat** to play Product Manager + System Architect. That
chat is a plain claude.ai conversation with **no repo access**, and it shares no memory with the Lead
Engineer's Claude Code chat. We need a way for two isolated AI chats to collaborate reliably.

## Decision

Adopt a three-party model with the Founder as courier and decision-maker:

- **Founder** — final decisions, priorities, and relays all messages between the two AI chats.
- **PM + System Architect** (new Claude chat, no repo) — owns product vision, roadmap, scope, user
  stories, acceptance criteria, and *high-level* architecture.
- **Lead Engineer** (this Claude Code chat, with repo) — owns detailed technical design, code, and final
  say on technical feasibility.

Mechanics:

- The repo `docs/` + this decision log are the **canonical source of truth.** Chat history is disposable.
- All cross-AI communication is **copy-paste, relayed by the Founder**, using the `PM → ENG` / `ENG → PM`
  message blocks defined in [`../../TEAM.md`](../../TEAM.md).
- A new PM chat is bootstrapped by pasting [`../pm-onboarding-brief.md`](../pm-onboarding-brief.md).
- Significant / ⚠ decisions are recorded here so they survive both chats' lack of shared memory.

The PM↔Engineer architecture boundary: PM sets the conceptual shape; Engineer owns detailed design and
feasibility; on conflict, the Engineer raises it with rationale and the Founder breaks the tie.

## Consequences

- Onboarding a replacement/parallel PM is a single paste — context isn't trapped in a chat.
- Decisions and architecture are durable and auditable, independent of any chat's memory.
- Overhead: the Founder must relay messages and the Engineer must write self-contained excerpts/decisions
  rather than assuming shared context. Accepted as the cost of isolated chats.

## Related

- [`TEAM.md`](../../TEAM.md) — roles, decision rights, message formats, cadence.
- [`docs/pm-onboarding-brief.md`](../pm-onboarding-brief.md) — the PM bootstrap document.
