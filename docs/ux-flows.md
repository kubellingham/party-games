# End-to-End UX Flow

The player's journey from opening Gatherd to returning to the home screen, and the states in between.
This is the connective tissue: each screen names the context(s) that power it, so the doc set and the
implementation line up. Mobile-first PWA throughout.

## The happy path

```
Open app
  └─▶ Identity resolves (guest auto-created, or returning session)        [identity]
        └─▶ HOME                                                          [catalog, social, progression, economy]
              ├─▶ Create room ─┐
              ├─▶ Join by code ┤
              ├─▶ Quick Play ──┤ (matchmaking, later)
              └─▶ Browse games ┘
                    └─▶ LOBBY                                             [catalog, content, social, room]
                          • pick game + content pack(s) + config
                          • invite friends / share code-link
                          • everyone readies
                          └─▶ IN-GAME                                     [engine, room]
                                • per-player views, timers, turns
                                └─▶ RESULTS                               [progression, economy, memories]
                                      • scores + reward moment (XP, coins, unlocks, level-ups)
                                      • MVP / highlights
                                      ├─▶ Rematch ───────▶ IN-GAME
                                      ├─▶ Next game ─────▶ LOBBY
                                      ├─▶ Add recent players ─▶ [social]
                                      └─▶ Home ──────────▶ HOME
```

## Screen-by-screen

### App open / identity
- **Goal:** zero-friction entry. A first-time visitor becomes a **guest** instantly (no signup); a
  returning player resumes their identity (persisted guest id or signed-in account).
- **Powered by:** `identity`. Guest→account upgrade is *offered*, never *required*, until a social
  feature needs it (`social.md`).
- **Edge:** arriving via a room-code deep link skips Home and goes straight toward Lobby (still creates
  a guest first).

### Home
- **Goal:** get into a game in seconds, and feel Gatherd is alive between sessions.
- **Powered by:** `catalog` (games), `social` (friends online, invites), `progression` (level summary),
  `economy` (balances), `content`/`liveops` (featured/seasonal). Detail in `home-and-navigation.md`.

### Lobby
- **Goal:** assemble the group and configure the game with no confusion.
- **Powered by:** `catalog` (manifest → config UI, player limits), `content` (pack selection),
  `social` (invites), `room` (roster, ready, host controls). Detail in `room-experience.md`.

### In-game
- **Goal:** the game itself — fair, legible, fun.
- **Powered by:** `engine` (authoritative state + `projectView` per-player views), `room` (transport,
  timers, host moderation, reconnection). Cosmetics (`cosmetics.md`) render here (avatars, emotes).

### Results
- **Goal:** the payoff and the reason to go again. This is the emotional peak.
- **Powered by:** `progression` (XP/level/achievement reward summary), `economy` (coins earned),
  `memories` (captures standout moments), `room` (scoreboard, rematch/next). Detail in
  `room-experience.md` + `progression.md`.

### Post-game / return
- **Goal:** keep the group together. Rematch and "next game" are one tap; recent players are
  one-tap-add (`social.md`); leaving lands you on a Home that reflects what just happened.

## Cross-cutting flows

### Reconnection / resume
A dropped player rejoins the **same room and the correct per-player view** within the reconnection
window (already implemented in `RoomController`/`LobbyRoom`). Home shows a "rejoin your game" entry if a
session is in progress.

### Invitations / deep links
A room code or link can be shared anywhere; opening it routes (guest-create →) Lobby. Friend/party
invites push a "join" prompt (`social.md`).

### Guest → account upgrade
Triggered *contextually* (adding a friend, saving cosmetics, going cross-device), never as a gate to
play. The upgrade preserves the guest's progress/identity.

## Principles this flow encodes (from the vision)

- **Seconds to gather:** Home → playing is ≤ 3 taps; deep links collapse it further.
- **Learn Gatherd once:** every screen is the same shell (`design-language.md`); only the in-game
  surface changes.
- **The group is the unit:** rematch/next-game/recent-players keep the table together by default.
- **Alive between sessions:** Home and Results surface progression, friends, and memories, not just a
  "play" button.

## Open questions (→ `open-questions.md`)

- Is **Quick Play / public matchmaking** in the near-term scope, or private rooms first?
- How aggressive is the guest→account upgrade prompt (and what's the minimum friction)?

## Build-now vs later

- **Now (when implementation resumes):** Home → Lobby → In-game → Results → (rematch/next/home) for
  private rooms with the existing game; results reward moment.
- **Later:** Quick Play/matchmaking, account upgrade flows, seasonal home surfaces.
