import { describe, it, expect, vi } from "vitest";
import type { EventEnvelope } from "@party/contracts";
import { InProcessEventBus } from "./in-process-bus";
import { idempotent } from "./idempotent";

const envelope = (over: Partial<EventEnvelope> = {}): EventEnvelope => ({
  id: "evt-1",
  type: "game.finished",
  version: 1,
  occurredAt: 0,
  sequence: 0,
  source: { roomId: "r1", gameId: "g1" },
  players: [],
  payload: {},
  ...over,
});

describe("InProcessEventBus", () => {
  it("delivers to matching subscribers only", async () => {
    const bus = new InProcessEventBus();
    const all = vi.fn();
    const onlyFinished = vi.fn();
    bus.subscribe(all);
    bus.subscribe(onlyFinished, { types: ["game.finished"] });

    await bus.publish(envelope({ type: "game.started" }));
    expect(all).toHaveBeenCalledTimes(1);
    expect(onlyFinished).not.toHaveBeenCalled();

    await bus.publish(envelope({ type: "game.finished" }));
    expect(all).toHaveBeenCalledTimes(2);
    expect(onlyFinished).toHaveBeenCalledTimes(1);
  });

  it("retries a flaky consumer (at-least-once)", async () => {
    const bus = new InProcessEventBus({ maxAttempts: 3 });
    let attempts = 0;
    const handler = vi.fn(() => {
      attempts++;
      if (attempts < 2) throw new Error("transient");
    });
    bus.subscribe(handler);
    await bus.publish(envelope());
    expect(attempts).toBe(2);
  });

  it("dead-letters after exhausting attempts without throwing to the publisher", async () => {
    const onDeadLetter = vi.fn();
    const bus = new InProcessEventBus({ maxAttempts: 2, onDeadLetter });
    bus.subscribe(
      () => {
        throw new Error("always fails");
      },
      { name: "broken" },
    );
    await expect(bus.publish(envelope())).resolves.toBeUndefined();
    expect(onDeadLetter).toHaveBeenCalledOnce();
  });

  it("isolates consumers: one failing does not stop another", async () => {
    const bus = new InProcessEventBus({ maxAttempts: 1, onDeadLetter: () => {} });
    const good = vi.fn();
    bus.subscribe(() => {
      throw new Error("boom");
    });
    bus.subscribe(good);
    await bus.publish(envelope());
    expect(good).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops delivery", async () => {
    const bus = new InProcessEventBus();
    const handler = vi.fn();
    const sub = bus.subscribe(handler);
    sub.unsubscribe();
    await bus.publish(envelope());
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("idempotent", () => {
  it("processes an event id once despite duplicate delivery", async () => {
    const inner = vi.fn();
    const handler = idempotent(inner);
    await handler(envelope({ id: "dup" }));
    await handler(envelope({ id: "dup" }));
    await handler(envelope({ id: "other" }));
    expect(inner).toHaveBeenCalledTimes(2);
  });

  it("does not record the id if the handler throws (so it can be retried)", async () => {
    let calls = 0;
    const handler = idempotent(() => {
      calls++;
      if (calls === 1) throw new Error("fail first");
    });
    await expect(handler(envelope({ id: "x" }))).rejects.toThrow();
    await handler(envelope({ id: "x" })); // retry succeeds
    expect(calls).toBe(2);
  });
});
