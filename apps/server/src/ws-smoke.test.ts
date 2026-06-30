import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client, type Room } from "colyseus.js";
import { startServer, type RunningServer } from "./server";

const PORT = 2599;

type View = {
  room: { status: string; players: { id: string; ready: boolean }[] };
  game: { phase?: string; reveal: unknown; answeredPlayers?: string[] } | null;
};

/** Records the latest "view" + "welcome" for a room and lets tests await conditions on them. */
class RoomProbe {
  latest: View | undefined;
  welcome: { playerId: string; code: string } | undefined;
  lastError: { message: string } | undefined;
  constructor(room: Room) {
    room.onMessage<View>("view", (v) => (this.latest = v));
    room.onMessage<{ playerId: string; code: string }>("welcome", (w) => (this.welcome = w));
    room.onMessage<{ message: string }>("error", (e) => (this.lastError = e));
  }
  async waitForWelcome(timeoutMs = 2000) {
    await poll(() => this.welcome !== undefined, timeoutMs, "welcome");
    return this.welcome!;
  }
  async waitForView(predicate: (v: View) => boolean, timeoutMs = 3000) {
    await poll(() => (this.latest ? predicate(this.latest) : false), timeoutMs, "view");
    return this.latest!;
  }
}

function poll(cond: () => boolean, timeoutMs: number, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (cond()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error(`timed out waiting for ${label}`));
      setTimeout(tick, 25);
    };
    tick();
  });
}

describe("websocket end-to-end", () => {
  let server: RunningServer;
  beforeAll(async () => {
    server = await startServer(PORT);
  });
  afterAll(async () => {
    await server.stop();
  });

  it("two guests create/join by code, play a round, and only see allowed info", async () => {
    const hostRoom = await new Client(`ws://localhost:${PORT}`).create("lobby", {
      name: "Alice",
      playerId: "alice",
    });
    const hostProbe = new RoomProbe(hostRoom);
    const { code } = await hostProbe.waitForWelcome();
    expect(code).toMatch(/^[A-Z2-9]{4}$/);

    const guestRoom = await new Client(`ws://localhost:${PORT}`).joinById(code, {
      name: "Bob",
      playerId: "bob",
    });
    const guestProbe = new RoomProbe(guestRoom);
    await guestProbe.waitForWelcome();

    // Both ready up. Wait until the host sees BOTH players ready before starting, otherwise
    // `start` can race ahead of the guest's `ready` arriving at the server.
    hostRoom.send("ready", { ready: true });
    guestRoom.send("ready", { ready: true });
    await hostProbe.waitForView((v) => v.room.players.length === 2 && v.room.players.every((p) => p.ready));
    hostRoom.send("start", { gameId: "would-you-rather", config: { rounds: 1 } });

    await guestProbe.waitForView((v) => v.room.status === "playing");
    expect(hostProbe.lastError).toBeUndefined();

    // Host answers — the guest must not see the host's choice until the reveal.
    hostRoom.send("action", { action: "answer", payload: { choice: "a" } });
    const midView = await guestProbe.waitForView(
      (v) => v.game?.answeredPlayers?.includes("alice") ?? false,
    );
    expect(midView.game?.reveal).toBeNull();

    await hostRoom.leave();
    await guestRoom.leave();
  });
});
