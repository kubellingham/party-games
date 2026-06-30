import { describe, it, expect } from "vitest";
import { InProcessEventBus } from "@party/event-bus";
import { registerProgression } from "@party/platform-profile";
import { RoomController } from "./room-controller";
import { GAME_REGISTRY } from "./game-registry";

/**
 * End-to-end through the real spine — bus, engine, the would-you-rather module, and the
 * progression consumer — with Colyseus swapped out for direct RoomController calls. This is the
 * proof of the whole architecture: a platform context (progression) reacts to a game it has never
 * heard of, purely via canonical events, and the host/lobby/turn/finish flow holds together.
 */
describe("full room flow", () => {
  it("creates, plays would-you-rather, and awards XP via the progression consumer", async () => {
    const bus = new InProcessEventBus();
    const { service: progression } = registerProgression(bus);

    const room = new RoomController({ roomId: "TEST", bus, registry: GAME_REGISTRY });

    room.join("alice", "Alice"); // first joiner becomes host
    room.join("bob", "Bob");
    expect(room.snapshot().players.find((p) => p.id === "alice")?.isHost).toBe(true);

    // Non-host cannot start.
    await expect(room.startGame("bob", "would-you-rather")).rejects.toThrow(/host/);
    // Not enough ready players yet.
    await expect(room.startGame("alice", "would-you-rather")).rejects.toThrow(/ready/);

    room.setReady("alice", true);
    room.setReady("bob", true);
    await room.startGame("alice", "would-you-rather", { rounds: 1 });
    expect(room.snapshot().status).toBe("playing");

    // Hidden info: before everyone answers, Bob cannot see Alice's choice.
    await room.dispatch("alice", "answer", { choice: "a" });
    const bobMidView = room.viewFor("bob").game as { reveal: unknown; answeredPlayers: string[] };
    expect(bobMidView.reveal).toBeNull();
    expect(bobMidView.answeredPlayers).toEqual(["alice"]);

    // Everyone in -> reveal, then advance to finish the single round.
    await room.dispatch("bob", "answer", { choice: "a" });
    await room.dispatch("alice", "advance", {});
    expect(room.snapshot().status).toBe("finished");

    // The progression context reacted to game.finished + scores_finalized with zero game coupling.
    expect(progression.get("alice").gamesPlayed).toBe(1);
    expect(progression.get("bob").gamesPlayed).toBe(1);
    expect(progression.get("alice").xp).toBeGreaterThan(0); // both chose the majority "a"
    expect(progression.get("bob").xp).toBeGreaterThan(0);
  });

  it("reassigns host when the host disconnects", () => {
    const bus = new InProcessEventBus();
    const room = new RoomController({ roomId: "TEST2", bus, registry: GAME_REGISTRY });
    room.join("alice", "Alice");
    room.join("bob", "Bob");
    room.markDisconnected("alice");
    expect(room.snapshot().players.find((p) => p.id === "bob")?.isHost).toBe(true);
  });
});
