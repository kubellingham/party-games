import type { PlayerId } from "@party/contracts";

/**
 * A game-domain fact returned by a reducer. The engine runtime wraps these into versioned
 * {@link import("@party/contracts").EventEnvelope}s and publishes them — games never touch the
 * bus. Types should be namespaced per game, e.g. "wyr.round_completed".
 */
export interface GameEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  /** Payload schema version; defaults to 1. Bump on breaking changes. */
  readonly version?: number;
  /** Players this fact concerns. Defaults to all players in the room. */
  readonly players?: readonly PlayerId[];
}

/** Server-driven timer operations. Timers live on the server so they survive disconnects. */
export type TimerOp =
  | { readonly op: "set"; readonly id: string; readonly delayMs: number }
  | { readonly op: "cancel"; readonly id: string };

/** Everything a game's pure functions are allowed to see. No I/O, no platform access. */
export interface GameContext<S, Cfg> {
  readonly state: S;
  readonly config: Cfg;
  readonly players: readonly PlayerId[];
  /** Injected server clock (ms). Use instead of Date.now() so logic stays deterministic. */
  readonly now: number;
  /** Injected seeded RNG in [0,1). Use instead of Math.random() for reproducibility. */
  readonly random: () => number;
}

/** Result of applying an action or timer: the next state plus optional facts and timer ops. */
export interface Reduction<S> {
  readonly state: S;
  readonly events?: readonly GameEvent[];
  readonly timers?: readonly TimerOp[];
}

export interface ActionHandler<S, Cfg, A> {
  /** Authorize + validate. Return a string (rejection reason) or throw to reject the action. */
  validate?(ctx: GameContext<S, Cfg>, player: PlayerId, action: A): string | void;
  reduce(ctx: GameContext<S, Cfg>, player: PlayerId, action: A): Reduction<S>;
}

/** Describes the current turn, used to auto-emit canonical `game.turn_started` events. */
export interface TurnInfo {
  readonly turn: number;
  readonly activePlayers: readonly PlayerId[];
}

/**
 * The contract every game implements. Adding a game = adding a module that satisfies this.
 * `Actions` maps action name -> action payload type.
 */
export interface GameDefinition<S, Cfg, Actions extends Record<string, unknown>> {
  readonly id: string;
  readonly meta: { readonly name: string; readonly minPlayers: number; readonly maxPlayers: number };
  readonly defaultConfig: Cfg;
  setup(players: readonly PlayerId[], config: Cfg, random: () => number): S;
  readonly actions: { [K in keyof Actions]: ActionHandler<S, Cfg, Actions[K]> };
  /** A server timer fired. Advance state in response (e.g. round timeout). */
  onTimer?(ctx: GameContext<S, Cfg>, timerId: string): Reduction<S>;
  /**
   * SECRET-INFO FILTER. Full state lives only on the server; each player receives only this.
   * Mandatory: it is the single point that prevents cheating in hidden-information games.
   */
  projectView(ctx: GameContext<S, Cfg>, player: PlayerId): unknown;
  /** Optional turn selector; when its `turn` changes, the runtime emits `game.turn_started`. */
  currentTurn?(state: S): TurnInfo | null;
  isOver(state: S): boolean;
  /** Final per-player scores to publish on game end. Defaults to empty. */
  finalScores?(state: S): Record<string, number>;
}

export type AnyGameDefinition = GameDefinition<unknown, unknown, Record<string, unknown>>;
