import { describe, it, expect } from "vitest";
import { type EventEnvelope, GameEventType } from "@party/contracts";
import { InProcessEventBus } from "@party/event-bus";
import { ProgressionService } from "./progression";
import { registerProgression } from "./index";

const env = (type: string, payload: unknown, players: string[] = []): EventEnvelope => ({
  id: `evt-${Math.random()}`,
  type,
  version: 1,
  occurredAt: 0,
  sequence: 0,
  source: { roomId: "r1", gameId: "g1" },
  players,
  payload,
});

describe("ProgressionService", () => {
  it("awards participation + score XP and derives level", () => {
    const svc = new ProgressionService();
    svc.handle(env(GameEventType.ScoresFinalized, { scores: { p1: 20, p2: 0 } }));
    // p1: 10 + 20*5 = 110 -> level 2 ; p2: 10 -> level 1
    expect(svc.get("p1")).toMatchObject({ xp: 110, level: 2 });
    expect(svc.get("p2")).toMatchObject({ xp: 10, level: 1 });
  });

  it("counts completed games but ignores aborted ones", () => {
    const svc = new ProgressionService();
    svc.handle(env(GameEventType.Finished, { reason: "completed" }, ["p1", "p2"]));
    svc.handle(env(GameEventType.Finished, { reason: "aborted" }, ["p1"]));
    expect(svc.get("p1").gamesPlayed).toBe(1);
    expect(svc.get("p2").gamesPlayed).toBe(1);
  });

  it("reacts to events delivered over the bus, idempotently", async () => {
    const bus = new InProcessEventBus();
    const { service } = registerProgression(bus);
    const finalized = env(GameEventType.ScoresFinalized, { scores: { p1: 2 } });
    await bus.publish(finalized);
    await bus.publish(finalized); // duplicate delivery must not double-award
    expect(service.get("p1").xp).toBe(20); // 10 + 2*5, counted once
  });
});
