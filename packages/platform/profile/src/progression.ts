import {
  type EventEnvelope,
  type ScoresFinalizedPayload,
  type GameFinishedPayload,
  GameEventType,
} from "@party/contracts";

export interface PlayerProgress {
  playerId: string;
  xp: number;
  level: number;
  gamesPlayed: number;
}

/** Read/write store for progression. In-memory now; swap for Postgres-backed later. */
export interface ProgressStore {
  get(playerId: string): PlayerProgress;
  save(progress: PlayerProgress): void;
}

export class InMemoryProgressStore implements ProgressStore {
  private readonly rows = new Map<string, PlayerProgress>();
  get(playerId: string): PlayerProgress {
    return this.rows.get(playerId) ?? { playerId, xp: 0, level: 1, gamesPlayed: 0 };
  }
  save(progress: PlayerProgress): void {
    this.rows.set(progress.playerId, progress);
  }
}

const PARTICIPATION_XP = 10;
const XP_PER_SCORE_POINT = 5;
const XP_PER_LEVEL = 100;

const levelFor = (xp: number): number => 1 + Math.floor(xp / XP_PER_LEVEL);

/**
 * The Progression bounded context. It knows nothing about any specific game — it reacts only to
 * the canonical lifecycle facts every game emits. Adding a new game grants XP automatically;
 * no game code references progression, and progression references no game code.
 */
export class ProgressionService {
  constructor(private readonly store: ProgressStore = new InMemoryProgressStore()) {}

  /** The event types this context cares about — used to filter the bus subscription. */
  static readonly SUBSCRIBED = [
    GameEventType.Finished,
    GameEventType.ScoresFinalized,
  ] as const;

  get(playerId: string): PlayerProgress {
    return this.store.get(playerId);
  }

  /** Pure-ish reducer over a single event. Idempotency is handled by the bus wrapper. */
  handle(event: EventEnvelope): void {
    if (event.type === GameEventType.ScoresFinalized) {
      const { scores } = event.payload as ScoresFinalizedPayload;
      for (const [playerId, score] of Object.entries(scores)) {
        this.award(playerId, PARTICIPATION_XP + Math.max(0, score) * XP_PER_SCORE_POINT);
      }
    } else if (event.type === GameEventType.Finished) {
      const { reason } = event.payload as GameFinishedPayload;
      if (reason !== "completed") return;
      for (const playerId of event.players) {
        const current = this.store.get(playerId);
        this.store.save({ ...current, gamesPlayed: current.gamesPlayed + 1 });
      }
    }
  }

  private award(playerId: string, xp: number): void {
    const current = this.store.get(playerId);
    const nextXp = current.xp + xp;
    this.store.save({ ...current, xp: nextXp, level: levelFor(nextXp) });
  }
}
