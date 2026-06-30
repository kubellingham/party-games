import { describe, it, expect } from "vitest";
import { envelopeSchema } from "./envelope";
import { CANONICAL_EVENTS, GameEventType } from "./events";

describe("envelope", () => {
  it("accepts a well-formed envelope", () => {
    const result = envelopeSchema.safeParse({
      id: "evt-1",
      type: GameEventType.Finished,
      version: 1,
      occurredAt: Date.now(),
      sequence: 3,
      source: { roomId: "room-1", gameId: "would-you-rather" },
      players: ["p1", "p2"],
      payload: { reason: "completed" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an envelope missing required fields", () => {
    const result = envelopeSchema.safeParse({ type: "x", payload: {} });
    expect(result.success).toBe(false);
  });
});

describe("canonical events", () => {
  it("validates a scores_finalized payload", () => {
    const { schema } = CANONICAL_EVENTS[GameEventType.ScoresFinalized];
    expect(schema.safeParse({ scores: { p1: 10, p2: 0 } }).success).toBe(true);
    expect(schema.safeParse({ scores: { p1: "nope" } }).success).toBe(false);
  });

  it("every canonical event has a positive version", () => {
    for (const def of Object.values(CANONICAL_EVENTS)) {
      expect(def.version).toBeGreaterThan(0);
    }
  });
});
