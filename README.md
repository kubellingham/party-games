# Party Games — Social Gaming Platform

A platform for party games: create private rooms, join friends by code, and play a growing
library of games on one shared engine. This repo is the **platform (the container)** — adding a
new game means adding a module, not building a new app.

## Architecture in one breath

Server-authoritative game sessions emit **facts** onto an **event bus**; independent platform
contexts (profiles, progression, achievements, social, analytics) react to those facts without
the game engine ever knowing they exist.

```
game module ──reduce()──▶ engine runtime ──envelope──▶ event bus ──▶ platform consumers
   (rules)                  (1 adapter,                 (versioned     (progression,
                            authoritative)               contract)      achievements, …)
```

Key disciplines:

- **Dependency rule:** the game engine depends on nothing platform-side.
- **Server is the source of truth.** Clients only receive a per-player **view projection**
  (`projectView`), so hidden-information games (Mafia, Spy) and stranger play are safe by design.
- **Modular monolith now**, with the event bus behind an interface so consumers can split into
  workers and the transport can move to Redis Streams / NATS / Kafka later — without touching
  producers.

## Layout

```
apps/
  server/      Colyseus realtime + composition root (wires engine + consumers to the bus)
  web/         React/Vite PWA client
packages/
  contracts/   Versioned event envelope + schemas, shared types (the spine)
  event-bus/   Bus interface + in-process implementation
  engine/      GameDefinition contract, pure runner, runtime adapter
  games/*      One module per game (would-you-rather, …)
  platform/*   Bounded contexts: profile/progression, achievements, social, analytics, identity
  ui/          Shared React components
```

## Develop

```bash
pnpm install
pnpm typecheck      # tsc across all packages
pnpm test           # vitest across all packages
pnpm lint           # eslint
pnpm dev            # run server + web
```

See `/root/.claude/plans/` design notes and inline package READMEs for details.
