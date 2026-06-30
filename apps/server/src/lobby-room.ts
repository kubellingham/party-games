import { Room, type Client, generateId, logger } from "colyseus";
import { RoomController } from "./room-controller";
import { getRoomDeps } from "./room-deps";

interface JoinOptions {
  /** Stable guest id from the client (localStorage). Lets a player keep identity on reconnect. */
  playerId?: string;
  name?: string;
}

interface ClientData {
  playerId: string;
  name: string;
}

const RECONNECT_WINDOW_SECONDS = 30;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars

const makeCode = (): string =>
  Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join(
    "",
  );

/**
 * Colyseus is used purely as the room/transport/reconnection layer. Game state is NOT held in
 * Colyseus schema (which broadcasts identically to everyone); instead each client is sent its own
 * projected view via `client.send("view", ...)`, so hidden-information games stay safe. All real
 * logic lives in the transport-agnostic {@link RoomController}.
 */
export class LobbyRoom extends Room {
  private controller!: RoomController;

  override onCreate(): void {
    this.roomId = makeCode(); // friendly 4-char join code
    void this.setMetadata({ code: this.roomId });
    this.autoDispose = true;

    const { bus, registry } = getRoomDeps();
    this.controller = new RoomController({ roomId: this.roomId, bus, registry });

    this.onMessage("ready", (client, message: { ready: boolean }) => {
      this.controller.setReady(this.data(client).playerId, Boolean(message?.ready));
      this.pushViews();
    });

    this.onMessage("start", (client, message: { gameId: string; config?: unknown }) => {
      void this.guard(client, () =>
        this.controller.startGame(this.data(client).playerId, message.gameId, message?.config),
      );
    });

    this.onMessage("action", (client, message: { action: string; payload?: unknown }) => {
      void this.guard(client, () =>
        this.controller.dispatch(this.data(client).playerId, message.action, message?.payload),
      );
    });
  }

  override onJoin(client: Client, options: JoinOptions = {}): void {
    const data: ClientData = {
      playerId: options.playerId ?? generateId(),
      name: (options.name ?? "Guest").slice(0, 24),
    };
    client.userData = data;
    this.controller.join(data.playerId, data.name);
    // Tell the client its identity (and the code) so it can persist/reconnect.
    client.send("welcome", { playerId: data.playerId, code: this.roomId });
    this.pushViews();
  }

  override async onLeave(client: Client, consented?: boolean): Promise<void> {
    const { playerId, name } = this.data(client);
    this.controller.markDisconnected(playerId);
    this.pushViews();

    if (consented) return;
    try {
      await this.allowReconnection(client, RECONNECT_WINDOW_SECONDS);
      this.controller.join(playerId, name); // existing slot -> marked connected again
      this.pushViews();
    } catch {
      // Reconnection window elapsed; the player stays as a disconnected slot.
    }
  }

  override onDispose(): void {
    this.controller.dispose();
  }

  private data(client: Client): ClientData {
    return client.userData as ClientData;
  }

  /** Run a controller mutation, surfacing failures to just the acting client. */
  private async guard(client: Client, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.pushViews();
    } catch (err) {
      client.send("error", { message: err instanceof Error ? err.message : "action failed" });
    }
  }

  /** Send every connected client its own per-player view. */
  private pushViews(): void {
    for (const client of this.clients) {
      try {
        client.send("view", this.controller.viewFor(this.data(client).playerId));
      } catch (err) {
        logger.error("failed to push view", err);
      }
    }
  }
}
