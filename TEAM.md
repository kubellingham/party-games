# How We Work — Gatherd Team & Collaboration

Gatherd is built by a three-party team where two of the members are **separate AI chats that cannot
see each other or share memory.** This document is the canonical "how we work" — roles, who decides
what, and exactly how messages move between us. Read [`VISION.md`](VISION.md) for *what* we're building;
this is *how*.

## The team

| Member | Who | Owns |
| --- | --- | --- |
| **Founder** | the human (you) | Final decisions, priorities, money, and **relaying messages between the two AIs** (the courier). |
| **PM + System Architect** | a Claude chat (plain claude.ai, **no repo access**) | The *what & why*: product vision, roadmap, scope, user stories, acceptance criteria, and **high-level** architecture. |
| **Lead Engineer** | a Claude Code chat (this one, **with the repo**) | The *how*: detailed technical design, contracts, code, trade-offs, estimates, and final say on technical feasibility. |

> The PM role replaces the former external PM ("Julie"). Onboard a new PM chat by pasting
> [`docs/pm-onboarding-brief.md`](docs/pm-onboarding-brief.md) into a fresh Claude conversation.

## The hard constraint that shapes everything

The PM chat and the Engineer chat are **isolated**: no shared memory, no direct channel, and the PM
**cannot read the repo.** Therefore:

1. **The Founder relays every cross-AI message** by copy-paste.
2. **The repo `docs/` is the canonical source of truth,** maintained by the Engineer. When the PM needs
   repo context, the Engineer produces a **self-contained excerpt** for the Founder to paste.
3. **Decisions are written down** in the decision log ([`docs/decisions/`](docs/decisions/)) so they
   survive across both chats' separate, forgetful memories.

If it isn't in the repo or the decision log, assume the other AI doesn't know it.

## Decision rights

| Decision | Flow |
| --- | --- |
| Product vision & strategy | PM proposes → **Founder decides** |
| Priorities / roadmap / scope cuts | PM proposes (Engineer gives estimates + risks) → **Founder decides** |
| High-level architecture (which contexts, responsibilities, boundaries) | PM proposes → Engineer validates feasibility → **Founder decides** on conflict |
| Detailed technical design & implementation | **Engineer decides** → informs PM |
| Product open-questions ([`docs/open-questions.md`](docs/open-questions.md)) | PM answers → **Founder confirms** |
| Anything flagged **⚠ ask-before-build** | Must reach the **Founder** before work starts |

**Boundary between PM-architecture and Eng-architecture (the crux of "PM + System Architect"):**
the PM sets the *conceptual shape* — what systems exist, their responsibilities, how they relate,
non-functional targets ("must support guest play"). The Engineer turns that into *detailed design* —
data models, interfaces, libraries, code — and has the final call on **feasibility**. When the
Engineer disagrees with a high-level decision on engineering grounds, the Engineer raises it with
rationale and the **Founder breaks the tie.** The Engineer never silently changes product
scope/priorities; the PM never dictates implementation detail.

## How a piece of work flows (the loop)

```
PM sets milestone goal + acceptance criteria        (PM → ENG, relayed by Founder)
        │
Engineer designs, estimates, flags risks/questions  (ENG → PM, relayed by Founder)
        │
Founder approves (and answers ⚠ items)
        │
Engineer implements on the branch, keeps tests green
        │
Engineer reports: shipped / changed / new questions (ENG → PM, relayed by Founder)
        │
PM re-prioritizes → next milestone
```

Work in **milestone-sized loops**, not giant batches. Each loop ends with the Engineer reporting and
the PM re-prioritizing.

## Message format (copy-paste these blocks)

Keep cross-AI messages in these blocks so the receiving chat can parse intent at a glance. The Founder
pastes the whole block into the other chat.

### Engineer → PM

```
=== ENG → PM ===
Context:        <what this is about, 1–2 lines; link/paste repo excerpt if PM needs it>
Proposing/Need: <the design, the question, or the report>
Options + Rec:  <if a decision is needed: options with a recommendation>
Decision needed: <what you need from PM/Founder, and by when / to unblock what>
```

### PM → Engineer

```
=== PM → ENG ===
Direction:        <the decision or product direction>
Rationale:        <why — tie back to the vision>
Priorities:       <ordered, if multiple things>
Acceptance:       <how we'll know it's done — acceptance criteria>
Questions for ENG: <anything you need from the Engineer>
```

> Rule of thumb: every block should be understandable **without** the other chat's history — assume the
> reader has amnesia, because it does.

## Conventions

- **Source of truth:** the repo (`docs/`) + the decision log. Chat history is disposable.
- **Record decisions:** any significant or ⚠ decision becomes an entry in
  [`docs/decisions/`](docs/decisions/) (ADR-lite), written by the Engineer.
- **Lean implementation:** design for scale, build only what the current milestone needs.
- **Ask before building:** for anything that could significantly shape Gatherd's future, stop and ask
  the Founder first — 30 minutes of discussion beats weeks of refactoring.
- **Branch:** development happens on `claude/party-games-platform-838sk8` (see repo `README.md`).
