# Decision Log (ADR-lite)

This is Gatherd's **durable memory.** Because the PM chat and the Engineer chat share no memory and the
PM can't read the repo, decisions made through the team loop would otherwise be lost. Every significant
or **⚠ ask-before-build** decision is recorded here as a short, numbered entry.

Maintained by the **Lead Engineer**; the Founder confirms each decision before it's marked `accepted`.

## How to use

- One file per decision: `NNNN-short-title.md` (zero-padded, incrementing).
- Keep it short — this is ADR-*lite*. The goal is a durable record, not a thesis.
- Status: `proposed` → `accepted` (or `superseded by NNNN` / `rejected`).
- When a decision changes, write a **new** entry that supersedes the old one; don't rewrite history.
- Reference the relevant design doc(s) in `..` so detail lives there, not duplicated here.

## Template

```markdown
# NNNN — <title>

- **Status:** proposed | accepted | superseded by NNNN | rejected
- **Date:** YYYY-MM-DD
- **Deciders:** Founder, PM, Engineer (as applicable)

## Context
<the situation and forces; what prompted the decision>

## Decision
<what we decided, stated plainly>

## Consequences
<trade-offs, follow-ups, what this enables or constrains>

## Related
<links to docs/ files or other decisions>
```

## Index

| # | Decision | Status |
| --- | --- | --- |
| [0001](./0001-team-and-collaboration-model.md) | Team structure & collaboration model | accepted |
