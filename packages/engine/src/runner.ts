import {
  type EventEnvelope,
  type PlayerId,
  type RoomId,
  GameEventType,
  newId,
} from "@party/contracts";
import type { GameContext, GameDefinition, GameEvent, TimerOp, TurnInfo } from "./types";
import { ActionRejected, EngineError } from "./errors";

export interface RunnerDeps {
  /** Server clock. Inject a fixed/controllable clock in tests. Default: Date.now. */
  readonly now?: () => number;
  /** Seeded RNG. Inject a deterministic source in tests. Default: Math.random. */
  readonly random?: () => number;
  /** Envelope id factory. Inject a counter in tests. Default: crypto.randomUUID. */
  readonly nextId?: () => string;
}

export interface RunnerInit<Cfg> extends RunnerDeps {
  readonly roomId: RoomId;
  readonly players: readonly PlayerId[];
  readonly config?: Cfg;
}

/** Output of every state transition: facts to publish and timer ops for the host to schedule. */
export interface RunResult {
  readonly envelopes: EventEnvelope[];
  readonly timers: TimerOp[];
}

/**
 * The authoritative, transport-agnostic game runner. It holds the full state, applies actions
 * through the game's reducer, and translates the game's domain events PLUS automatic canonical
 * lifecycle events into envelopes. It performs no I/O and never imports the bus — that wiring is
 * the {@link EngineRuntime}'s job — which is exactly what makes it unit-testable without a network.
 */
export class GameRunner<S, Cfg, Actions extends Record<string, unknown>> {
  private state: S;
  private status: "created" | "running" | "finished" = "created";
  private sequence = 0;
  private lastTurn: number | null = null;

  private readonly now: () => number;
  private readonly random: () => number;
  private readonly nextId: () => string;
  private readonly roomId: RoomId;
  private readonly players: readonly PlayerId[];
  private readonly config: Cfg;

  constructor(
    private readonly def: GameDefinition<S, Cfg, Actions>,
    init: RunnerInit<Cfg>,
  ) {
    this.now = init.now ?? Date.now;
    this.random = init.random ?? Math.random;
    this.nextId = init.nextId ?? newId;
    this.roomId = init.roomId;
    this.players = init.players;
    this.config = init.config ?? def.defaultConfig;
    this.state = def.setup(this.players, this.config, this.random);
  }

  /** Begin the game: emits `game.started`, plus `game.turn_started` if the game has turns. */
  start(): RunResult {
    if (this.status !== "created") throw new EngineError("game already started");
    this.status = "running";
    const result = this.emptyResult();
    this.push(result, GameEventType.Started, 1, { playerCount: this.players.length }, this.players);
    this.emitTurnIfChanged(result);
    this.emitFinishIfOver(result);
    return result;
  }

  /** Apply a player action. Throws {@link ActionRejected} if validation fails. */
  dispatch<K extends keyof Actions>(player: PlayerId, action: K, payload: Actions[K]): RunResult {
    this.assertRunning();
    const handler = this.def.actions[action];
    if (!handler) throw new ActionRejected(`unknown action: ${String(action)}`);

    const ctx = this.context();
    if (handler.validate) {
      let reason: string | void;
      try {
        reason = handler.validate(ctx, player, payload);
      } catch (err) {
        throw new ActionRejected(err instanceof Error ? err.message : String(err));
      }
      if (typeof reason === "string") throw new ActionRejected(reason);
    }
    return this.applyReduction(handler.reduce(ctx, player, payload));
  }

  /** Fire a previously-scheduled server timer. */
  fireTimer(timerId: string): RunResult {
    this.assertRunning();
    if (!this.def.onTimer) return this.emptyResult();
    return this.applyReduction(this.def.onTimer(this.context(), timerId));
  }

  /** The filtered view a specific player is allowed to see. */
  view(player: PlayerId): unknown {
    return this.def.projectView(this.context(), player);
  }

  /** Full authoritative state — server-only (persistence, reconnection snapshots, debugging). */
  snapshot(): S {
    return this.state;
  }

  isFinished(): boolean {
    return this.status === "finished";
  }

  // --- internals -----------------------------------------------------------

  private applyReduction(reduction: {
    state: S;
    events?: readonly GameEvent[];
    timers?: readonly TimerOp[];
  }): RunResult {
    this.state = reduction.state;
    const result = this.emptyResult();
    for (const event of reduction.events ?? []) {
      this.push(
        result,
        event.type,
        event.version ?? 1,
        event.payload,
        event.players ?? this.players,
      );
    }
    if (reduction.timers) result.timers.push(...reduction.timers);
    this.emitTurnIfChanged(result);
    this.emitFinishIfOver(result);
    return result;
  }

  private emitTurnIfChanged(result: RunResult): void {
    if (this.status !== "running" || !this.def.currentTurn) return;
    const turn: TurnInfo | null = this.def.currentTurn(this.state);
    if (turn && turn.turn !== this.lastTurn) {
      this.lastTurn = turn.turn;
      this.push(
        result,
        GameEventType.TurnStarted,
        1,
        { turn: turn.turn, activePlayers: turn.activePlayers.map(String) },
        turn.activePlayers,
      );
    }
  }

  private emitFinishIfOver(result: RunResult): void {
    if (this.status !== "running" || !this.def.isOver(this.state)) return;
    this.status = "finished";
    this.push(result, GameEventType.Finished, 1, { reason: "completed" }, this.players);
    const scores = this.def.finalScores?.(this.state) ?? {};
    this.push(result, GameEventType.ScoresFinalized, 1, { scores }, this.players);
  }

  private context(): GameContext<S, Cfg> {
    return {
      state: this.state,
      config: this.config,
      players: this.players,
      now: this.now(),
      random: this.random,
    };
  }

  private push(
    result: RunResult,
    type: string,
    version: number,
    payload: unknown,
    players: readonly PlayerId[],
  ): void {
    result.envelopes.push({
      id: this.nextId(),
      type,
      version,
      occurredAt: this.now(),
      sequence: this.sequence++,
      source: { roomId: this.roomId, gameId: this.def.id },
      players: players.map(String),
      payload,
    });
  }

  private emptyResult(): RunResult {
    return { envelopes: [], timers: [] };
  }

  private assertRunning(): void {
    if (this.status === "created") throw new EngineError("game not started");
    if (this.status === "finished") throw new EngineError("game already finished");
  }
}
