import { z } from "zod";

/**
 * Canonical lifecycle events. The engine runtime emits these for EVERY game automatically,
 * derived from engine state transitions — so platform consumers (progression, analytics,
 * achievements) work for all games out of the box, even games that emit no custom events.
 *
 * Game modules may additionally emit their own domain events (e.g. "wyr.round_completed");
 * those are namespaced and validated by the owning game, not here.
 */
export const GameEventType = {
  Started: "game.started",
  TurnStarted: "game.turn_started",
  Finished: "game.finished",
  ScoresFinalized: "game.scores_finalized",
} as const;

export type GameEventType = (typeof GameEventType)[keyof typeof GameEventType];

export const gameStartedPayload = z.object({
  playerCount: z.number().int().nonnegative(),
});
export type GameStartedPayload = z.infer<typeof gameStartedPayload>;

export const turnStartedPayload = z.object({
  turn: z.number().int().nonnegative(),
  activePlayers: z.array(z.string()),
});
export type TurnStartedPayload = z.infer<typeof turnStartedPayload>;

export const gameFinishedPayload = z.object({
  reason: z.enum(["completed", "aborted"]),
});
export type GameFinishedPayload = z.infer<typeof gameFinishedPayload>;

export const scoresFinalizedPayload = z.object({
  /** playerId -> final score for this game. */
  scores: z.record(z.string(), z.number()),
});
export type ScoresFinalizedPayload = z.infer<typeof scoresFinalizedPayload>;

/** Registry: canonical event type -> payload schema + current version. */
export const CANONICAL_EVENTS = {
  [GameEventType.Started]: { schema: gameStartedPayload, version: 1 },
  [GameEventType.TurnStarted]: { schema: turnStartedPayload, version: 1 },
  [GameEventType.Finished]: { schema: gameFinishedPayload, version: 1 },
  [GameEventType.ScoresFinalized]: { schema: scoresFinalizedPayload, version: 1 },
} as const;

/** Typed payload lookup for canonical events. */
export interface CanonicalPayloads {
  [GameEventType.Started]: GameStartedPayload;
  [GameEventType.TurnStarted]: TurnStartedPayload;
  [GameEventType.Finished]: GameFinishedPayload;
  [GameEventType.ScoresFinalized]: ScoresFinalizedPayload;
}
