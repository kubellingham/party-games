import { type PlayerId } from "@party/contracts";
import type { GameDefinition } from "./types";

/**
 * A deliberately minimal game used only by engine tests. It exercises every engine feature:
 * turns, custom domain events, server timers, hidden per-player info (via projectView),
 * end-of-game detection, and final scoring.
 */
export interface FakeState {
  count: number;
  target: number;
  moves: number;
  /** Secret known only to each owning player — must never leak through projectView. */
  secrets: Record<string, number>;
  timedOut: boolean;
}

export interface FakeConfig {
  target: number;
}

// NB: use a `type` (not `interface`) for action maps — only type aliases satisfy the
// `Record<string, unknown>` constraint on GameDefinition's Actions parameter.
export type FakeActions = {
  bump: { amount: number };
};

export const fakeGame: GameDefinition<FakeState, FakeConfig, FakeActions> = {
  id: "fake",
  meta: { name: "Fake", minPlayers: 2, maxPlayers: 4 },
  defaultConfig: { target: 3 },
  setup(players, config) {
    const secrets: Record<string, number> = {};
    players.forEach((p, i) => (secrets[p] = i + 100));
    return { count: 0, target: config.target, moves: 0, secrets, timedOut: false };
  },
  actions: {
    bump: {
      validate(ctx, player) {
        const active = ctx.players[ctx.state.moves % ctx.players.length];
        if (player !== active) return "not your turn";
      },
      reduce(ctx, _player, action) {
        const state: FakeState = {
          ...ctx.state,
          count: ctx.state.count + action.amount,
          moves: ctx.state.moves + 1,
        };
        return {
          state,
          events: [{ type: "fake.bumped", payload: { count: state.count }, version: 1 }],
          timers: [{ op: "set", id: "round", delayMs: 1000 }],
        };
      },
    },
  },
  onTimer(ctx, timerId) {
    if (timerId !== "round") return { state: ctx.state };
    return { state: { ...ctx.state, timedOut: true, count: ctx.state.target } };
  },
  currentTurn(state) {
    return { turn: state.moves, activePlayers: [] as PlayerId[] };
  },
  projectView(ctx, player) {
    // Reveal only the requesting player's secret; never the whole secrets map.
    return {
      count: ctx.state.count,
      target: ctx.state.target,
      moves: ctx.state.moves,
      yourSecret: ctx.state.secrets[player],
    };
  },
  isOver(state) {
    return state.count >= state.target;
  },
  finalScores(state) {
    return { total: state.count };
  },
};
