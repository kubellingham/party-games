import { type EventBus } from "@party/event-bus";
import { type AnyGameDefinition, EngineRuntime, GameRunner } from "@party/engine";
import { PlayerId, RoomId } from "@party/contracts";

export interface LobbyPlayer {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
}

export type RoomStatus = "lobby" | "playing" | "finished";

export interface RoomSnapshot {
  status: RoomStatus;
  gameId: string | null;
  players: LobbyPlayer[];
}

export interface PlayerView {
  room: RoomSnapshot;
  /** The game's per-player projected view, or null while in the lobby. */
  game: unknown;
}

export interface RoomControllerOptions {
  roomId: string;
  bus: EventBus;
  registry: Record<string, AnyGameDefinition>;
}

/**
 * Transport-agnostic room logic: lobby (players/ready/host), game lifecycle, and per-player view
 * projection. It is the seam Colyseus plugs into — and because it has no Colyseus dependency, the
 * full create→lobby→play→finish flow is unit-testable without a network. The server stays
 * authoritative; clients only ever receive {@link viewFor} output.
 */
export class RoomController {
  private readonly players = new Map<string, LobbyPlayer>();
  private status: RoomStatus = "lobby";
  private gameId: string | null = null;
  private runtime: EngineRuntime<unknown, unknown, Record<string, unknown>> | null = null;

  constructor(private readonly opts: RoomControllerOptions) {}

  /** Add a player, or mark an existing (reconnecting) player as connected again. */
  join(playerId: string, name: string): void {
    const existing = this.players.get(playerId);
    if (existing) {
      existing.connected = true;
      return;
    }
    this.players.set(playerId, {
      id: playerId,
      name,
      connected: true,
      ready: false,
      isHost: this.players.size === 0,
    });
  }

  /** Mark a player disconnected. Their slot is retained so they can reconnect mid-game. */
  markDisconnected(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;
    if (player.isHost) this.reassignHost(playerId);
  }

  setReady(playerId: string, ready: boolean): void {
    const player = this.players.get(playerId);
    if (player) player.ready = ready;
  }

  /** Start a game. Host-only; requires lobby status, a known game, and enough ready players. */
  async startGame(playerId: string, gameId: string, config?: unknown): Promise<void> {
    const host = this.players.get(playerId);
    if (!host?.isHost) throw new Error("only the host can start the game");
    if (this.status !== "lobby") throw new Error("game already in progress");

    const def = this.opts.registry[gameId];
    if (!def) throw new Error(`unknown game: ${gameId}`);

    const roster = [...this.players.values()].filter((p) => p.connected && p.ready);
    if (roster.length < def.meta.minPlayers) {
      throw new Error(`need at least ${def.meta.minPlayers} ready players`);
    }

    const runner = new GameRunner(def, {
      roomId: RoomId(this.opts.roomId),
      players: roster.map((p) => PlayerId(p.id)),
      config,
    });
    this.runtime = new EngineRuntime(runner, this.opts.bus);
    this.gameId = gameId;
    this.status = "playing";
    await this.runtime.start();
    this.syncFinished();
  }

  /** Forward a player action into the running game. Throws on invalid actions. */
  async dispatch(playerId: string, action: string, payload: unknown): Promise<void> {
    if (this.status !== "playing" || !this.runtime) throw new Error("no game in progress");
    await this.runtime.dispatch(PlayerId(playerId), action, payload);
    this.syncFinished();
  }

  /** What a specific player is allowed to see right now. */
  viewFor(playerId: string): PlayerView {
    return {
      room: this.snapshot(),
      game: this.runtime ? this.runtime.view(PlayerId(playerId)) : null,
    };
  }

  snapshot(): RoomSnapshot {
    return {
      status: this.status,
      gameId: this.gameId,
      players: [...this.players.values()],
    };
  }

  hasPlayers(): boolean {
    return this.players.size > 0;
  }

  dispose(): void {
    this.runtime?.dispose();
  }

  private syncFinished(): void {
    if (this.runtime?.isFinished()) this.status = "finished";
  }

  private reassignHost(leavingHostId: string): void {
    const heir = [...this.players.values()].find((p) => p.connected && p.id !== leavingHostId);
    if (heir) {
      for (const p of this.players.values()) p.isHost = p.id === heir.id;
    }
  }
}
