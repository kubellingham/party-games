import { describe, it, expect } from "vitest";
import { PlayerId, RoomId, GameEventType } from "@party/contracts";
import { GameRunner } from "./runner";
import { ActionRejected, EngineError } from "./errors";
import { fakeGame } from "./test-game";

const players = [PlayerId("p1"), PlayerId("p2")];

function makeRunner(target = 3) {
  let n = 0;
  return new GameRunner(fakeGame, {
    roomId: RoomId("room-1"),
    players,
    config: { target },
    now: () => 1000,
    random: () => 0.5,
    nextId: () => `evt-${n++}`,
  });
}

const types = (envelopes: { type: string }[]) => envelopes.map((e) => e.type);

describe("GameRunner lifecycle", () => {
  it("emits game.started then game.turn_started on start", () => {
    const runner = makeRunner();
    const { envelopes } = runner.start();
    expect(types(envelopes)).toEqual([GameEventType.Started, GameEventType.TurnStarted]);
    expect(envelopes[0]?.payload).toEqual({ playerCount: 2 });
    expect(envelopes[0]?.source).toEqual({ roomId: "room-1", gameId: "fake" });
  });

  it("assigns deterministic ids and monotonic sequence", () => {
    const runner = makeRunner();
    const { envelopes } = runner.start();
    expect(envelopes.map((e) => e.id)).toEqual(["evt-0", "evt-1"]);
    expect(envelopes.map((e) => e.sequence)).toEqual([0, 1]);
  });

  it("rejects an action from the wrong player", () => {
    const runner = makeRunner();
    runner.start();
    expect(() => runner.dispatch(PlayerId("p2"), "bump", { amount: 1 })).toThrow(ActionRejected);
  });

  it("emits the game's domain event plus a new turn on a valid action", () => {
    const runner = makeRunner();
    runner.start();
    const { envelopes, timers } = runner.dispatch(PlayerId("p1"), "bump", { amount: 1 });
    expect(types(envelopes)).toEqual(["fake.bumped", GameEventType.TurnStarted]);
    expect(timers).toEqual([{ op: "set", id: "round", delayMs: 1000 }]);
  });

  it("emits finished + scores_finalized when the game ends", () => {
    const runner = makeRunner(2);
    runner.start();
    runner.dispatch(PlayerId("p1"), "bump", { amount: 1 }); // count 1
    const { envelopes } = runner.dispatch(PlayerId("p2"), "bump", { amount: 1 }); // count 2 -> over
    expect(types(envelopes)).toContain(GameEventType.Finished);
    const scores = envelopes.find((e) => e.type === GameEventType.ScoresFinalized);
    expect(scores?.payload).toEqual({ scores: { total: 2 } });
    expect(runner.isFinished()).toBe(true);
  });

  it("refuses actions after the game is finished", () => {
    const runner = makeRunner(1);
    runner.start();
    runner.dispatch(PlayerId("p1"), "bump", { amount: 1 });
    expect(() => runner.dispatch(PlayerId("p2"), "bump", { amount: 1 })).toThrow(EngineError);
  });

  it("processes server timers via fireTimer", () => {
    const runner = makeRunner(99);
    runner.start();
    const { envelopes } = runner.fireTimer("round");
    // onTimer forces count to target -> game finishes
    expect(types(envelopes)).toContain(GameEventType.Finished);
  });
});

describe("projectView hides secret information", () => {
  it("reveals only the requesting player's secret", () => {
    const runner = makeRunner();
    runner.start();
    const view = runner.view(PlayerId("p1")) as { yourSecret: number };
    expect(view.yourSecret).toBe(100);
    // The full secrets map exists in state but must not appear in any player's view.
    expect(JSON.stringify(view)).not.toContain("101");
    expect(runner.snapshot().secrets).toEqual({ p1: 100, p2: 101 });
  });
});
