import { describe, it, expect } from "vitest";
import { PlayerId, RoomId, GameEventType, type EventEnvelope } from "@party/contracts";
import { InProcessEventBus } from "@party/event-bus";
import { GameRunner } from "./runner";
import { EngineRuntime } from "./runtime";
import type { TimerScheduler } from "./scheduler";
import { fakeGame } from "./test-game";

/** Manual scheduler so tests can fire timers deterministically. */
class ManualScheduler implements TimerScheduler {
  private fires = new Map<string, () => void>();
  set(id: string, _delayMs: number, fire: () => void) {
    this.fires.set(id, fire);
  }
  cancel(id: string) {
    this.fires.delete(id);
  }
  cancelAll() {
    this.fires.clear();
  }
  trigger(id: string) {
    this.fires.get(id)?.();
  }
}

function setup(target = 3) {
  const bus = new InProcessEventBus();
  const received: EventEnvelope[] = [];
  bus.subscribe((e) => void received.push(e), { name: "analytics" });
  const runner = new GameRunner(fakeGame, {
    roomId: RoomId("room-1"),
    players: [PlayerId("p1"), PlayerId("p2")],
    config: { target },
  });
  const scheduler = new ManualScheduler();
  const runtime = new EngineRuntime(runner, bus, scheduler);
  return { runtime, received, scheduler };
}

describe("EngineRuntime", () => {
  it("publishes runner envelopes to the bus in order", async () => {
    const { runtime, received } = setup();
    await runtime.start();
    await runtime.dispatch(PlayerId("p1"), "bump", { amount: 1 });
    const seqs = received.map((e) => e.sequence);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(received.map((e) => e.type)).toContain(GameEventType.Started);
    expect(received.map((e) => e.type)).toContain("fake.bumped");
  });

  it("schedules and fires server timers through the scheduler", async () => {
    const { runtime, received, scheduler } = setup(99);
    await runtime.start();
    await runtime.dispatch(PlayerId("p1"), "bump", { amount: 1 }); // schedules "round" timer
    scheduler.trigger("round"); // onTimer forces finish
    // allow the async flush triggered by the timer to settle
    await new Promise((r) => setTimeout(r, 0));
    expect(received.map((e) => e.type)).toContain(GameEventType.Finished);
  });
});
