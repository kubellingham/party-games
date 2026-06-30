# Social Systems

The layer that turns a game library into a place people return to *for each other*. Owned by
**`platform/social`** (friends, recent players, parties, invites, presence, safety) and
**`platform/identity`** (accounts, profiles, guest→user upgrade). This is the most direct expression of
the vision: the group is the unit, and Gatherd remembers it.

## Identity & profiles (`platform/identity`)

- **Guest-first:** everyone plays instantly as a guest (built). Social features that imply persistence
  (friends, cross-device, saved cosmetics) prompt a **guest→account upgrade** — contextual, never a gate
  to play. Upgrade preserves the guest's id/progress.
- **Public profile:**

```ts
interface PublicProfile {
  playerId: string;
  handle: string;                 // unique? (open question)
  displayName: string;
  avatar?: string; frame?: string; nameColor?: string;   // from cosmetics loadout
  title?: string;                 // from progression
  level: number;
  showcase: string[];             // pinned achievements / memories the player chose to show
  stats: ProfileStats;            // games played, favorite game, etc. (lightweight)
}
```

Profiles lean on **read models** from progression/cosmetics/memories — identity stores the account
basics and composes the rest via queries (dependency rule).

## Friends

- Request → accept model; friends list with **presence** (online / in a room / offline).
- One-tap **invite to room** when you're hosting or in a lobby.
- Presence is real-time (Redis-backed later; in-process for now) and privacy-aware.

## Recent players

- **Auto-tracked** from shared rooms: when a session ends, everyone you played with becomes a "recent
  player," built by consuming `room.player_joined` / `game.finished` events (event-sourced — no manual
  step).
- One-tap **add friend** from results or the Social tab. This is the primary friend-growth loop and a
  key "turn strangers into regulars" mechanic.
- Time-decayed / capped so the list stays useful.

## Parties

- A **persistent group** that travels together between rooms and games — the natural unit for a friend
  group that plays often.
- A party has a **leader**; the leader takes the party into a room (everyone follows). Parties survive
  across multiple games in a session and can persist between sessions.
- Party invites + party chat (chat = open question / later).

## Invitations

| Type | Mechanism |
| --- | --- |
| Room invite | Code + shareable deep link (built: code/link); friend invite pushes a join prompt |
| Friend request | In-app, from profile / recent players |
| Party invite | From the party UI |

Deep links route an opener (guest-create →) straight to the lobby (`ux-flows.md`).

## Safety (non-negotiable for stranger play)

- **Block** (no rooms/invites/visibility), **report** (player + content), **privacy settings** (who can
  friend/invite/see you).
- Reports route to moderation (`content.md` for content; host tools in `room-experience.md` for live
  rooms) and, later, AI moderation assistance (`ai-vision.md`).
- Default privacy errs safe, especially for younger users (age policy is an open question with real
  compliance weight).

## Events

**Consumes:** `room.player_joined`, `game.finished` (recent players, presence), `entitlement.granted`
(profile cosmetics), `progression.*` (profile level/title).

**Emits:** `social.friend_added`, `social.friend_removed`, `social.party_created`,
`social.player_reported`, `social.player_blocked`, `presence.changed`. These feed memories (shared
history), home (friends online), and safety/moderation.

## Open questions (→ `open-questions.md`)

- **Handles:** globally unique handles, or display-name + discriminator? (identity design + abuse)
- **Chat:** room/party text chat at launch? Big safety/moderation surface — **ask before building.**
- **Age policy:** minimum age, and how social + real-money interact with minors (compliance).
- Friend limits, recent-player retention window, party size (and Premium party-size perk).

## Build-now vs later

- **Now (when implementation resumes):** identity guest→account upgrade, basic public profile, friends
  (request/accept/presence), recent players from events, room/friend invites.
- **Later:** parties, blocking/reporting tooling depth, privacy settings UI, chat, profile showcases.
