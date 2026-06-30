# Room Experience

Everything that happens inside a room — before, during, and after a game. This is where Gatherd's
promise lives or dies, because the room *is* the gathering. Spans **`apps/server`** (the
`RoomController` + Colyseus `LobbyRoom`), the **`engine`**, and several platform contexts at the
results moment.

## The room state machine

Today `RoomController` has `lobby | playing | finished`. We extend it to support results and keeping
the group together across games:

```
        ┌────────────────────────────────────────────────┐
        ▼                                                  │
   ┌─────────┐   start    ┌──────────┐  game over  ┌──────────┐
   │  LOBBY  │ ─────────▶ │ IN-GAME  │ ──────────▶ │ RESULTS  │
   └─────────┘            └──────────┘             └──────────┘
        ▲                                            │  │  │
        │ next game / rematch (back to lobby/in-game)│  │  │ leave → room disposes when empty
        └────────────────────────────────────────────┘  │
                                                          └─ rematch → IN-GAME (same game/config)
```

A **session** is the sequence of games a group plays together in one sitting; the room persists across
games so the group, chat, and recent-players context stay intact. This directly serves "the group is
the unit."

## Before — the Lobby

- **Roster:** each player shown with avatar, frame, name color, title, level (cosmetics + progression
  read models). Connected/disconnected state visible.
- **Host controls:** the host picks the game, content pack(s), and config; can kick; can start.
  (`catalog` manifest → generic config UI; `content` → pack list filtered by entitlement/age/locale.)
- **Ready system:** players ready up; start is gated on min players ready (already implemented).
- **Invites:** room code, shareable deep link, and invite-a-friend / invite-party (`social.md`).
- **Spectators:** if the manifest `supportsSpectators`, extra joiners can watch (no secret info).

## During — In-game

- **Per-player views:** the engine's `projectView` sends each player only what they may see — the
  backbone of fair stranger play and hidden-info games. Client is a thin renderer.
- **Timers & turns:** server-driven timers (survive disconnects); turn indicators from canonical
  `game.turn_started`.
- **Host moderation:** kick / skip / end — host powers that keep a public room civil. Reports route to
  `social.md` safety.
- **Reconnection:** a dropped player rejoins the same room and correct view within the window (built).
- **Reactions/emotes:** equipped emotes (`cosmetics.md`) for in-the-moment shared laughs — rate-limited
  to prevent griefing (open question).

## After — Results

The emotional peak and the retention hinge. Results assembles data from several contexts (each reacting
to the same end-of-game events — no game coupling):

- **Scoreboard:** final placements from `game.scores_finalized`.
- **Reward moment:** XP gained, level-ups, achievements unlocked, coins earned — the `RewardSummary`
  from `progression.md` (+ `economy.md`).
- **Highlights / MVP:** standout moments (biggest comeback, funniest answer) — also fed to
  `memories.md`.
- **Keep going:** **Rematch** (same game/config), **Next game** (back to lobby), **Add recent players**
  (`social.md`), or **Home**.

## How the room stays decoupled

The room **emits facts**; it does not compute rewards or write to the wallet. `game.finished` and
`game.scores_finalized` flow onto the bus; progression, economy, memories, and analytics react. The
results screen then **reads** their projections (reward summary, memory captured). This is the dependency
rule (`architecture.md`) applied to the most feature-dense screen.

## Multi-game sessions & rematch

- **Rematch** re-runs the same game with the same roster/config — a new engine runtime, same room.
- **Next game** returns to lobby with the group intact for a fresh pick.
- Recent-players and memories accumulate across the whole session, so a long game night becomes one
  remembered gathering.

## Events

**Emits (room/engine):** `room.created`, `room.player_joined`, `room.player_left`, plus the engine's
canonical lifecycle + game-specific events. These feed social (recent players), memories, analytics.

**Consumes (for display):** reward/memory read models at results time.

## Open questions (→ `open-questions.md`)

- In-room **text chat** at launch? (moderation + safety cost in public rooms — **ask before building.**)
- Spectator rules for hidden-info games (can spectators see secrets?).
- Emote rate-limiting / host mute defaults.

## Build-now vs later

- **Now (when implementation resumes):** extend `RoomController` to `lobby → in-game → results →
  lobby`, results scoreboard + reward moment, rematch/next-game, host kick.
- **Later:** spectators, chat, emotes/reactions, highlights/MVP, party-aware lobby.
