import { describe, it, expect } from "vitest";
import { PlayerId, RoomId, GameEventType } from "@party/contracts";
import { GameRunner } from "@party/engine";
import { wouldYouRather } from "./game";
import type { WyrActions, WyrConfig, WyrState } from "./types";

const p1 = PlayerId("p1");
const p2 = PlayerId("p2");
const p3 = PlayerId("p3");

function runner(config: WyrConfig = { rounds: 2 }) {
  return new GameRunner<WyrState, WyrConfig, WyrActions>(wouldYouRather, {
    roomId: RoomId("r1"),
    players: [p1, p2, p3],
    config,
    random: () => 0, // deterministic prompt order
  });
}

const types = (es: { type: string }[]) => es.map((e) => e.type);

describe("would-you-rather", () => {
  it("sets up the requested number of rounds", () => {
    const r = runner({ rounds: 2 });
    expect(r.snapshot().totalRounds).toBe(2);
    expect(r.snapshot().prompts).toHaveLength(2);
  });

  it("announces answers without leaking the choice until reveal", () => {
    const r = runner();
    r.start();
    const { envelopes } = r.dispatch(p1, "answer", { choice: "a" });
    expect(types(envelopes)).toEqual(["wyr.answered"]);
    expect(JSON.stringify(envelopes[0]?.payload)).not.toContain("\"a\"");

    // p2 still cannot see p1's actual choice via the view.
    const view = r.view(p2) as { reveal: unknown; answeredPlayers: string[]; yourChoice: unknown };
    expect(view.reveal).toBeNull();
    expect(view.answeredPlayers).toEqual(["p1"]);
    expect(view.yourChoice).toBeNull();
  });

  it("rejects double-answering and answering in the wrong phase", () => {
    const r = runner();
    r.start();
    r.dispatch(p1, "answer", { choice: "a" });
    expect(() => r.dispatch(p1, "answer", { choice: "b" })).toThrow(/already answered/);
    expect(() => r.dispatch(p1, "advance", {})).toThrow(/after a reveal/);
  });

  it("reveals and scores the majority once everyone has answered", () => {
    const r = runner();
    r.start();
    r.dispatch(p1, "answer", { choice: "a" });
    r.dispatch(p2, "answer", { choice: "a" });
    const { envelopes } = r.dispatch(p3, "answer", { choice: "b" });
    const revealed = envelopes.find((e) => e.type === "wyr.round_revealed");
    expect(revealed?.payload).toMatchObject({ counts: { a: 2, b: 1 }, majority: "a" });
    expect(r.snapshot().scores).toEqual({ p1: 1, p2: 1 });

    const view = r.view(p3) as { reveal: { choices: Record<string, string> } };
    expect(view.reveal.choices).toEqual({ p1: "a", p2: "a", p3: "b" });
  });

  it("advances rounds (new turn) and finishes after the last round", () => {
    const r = runner({ rounds: 1 });
    r.start();
    r.dispatch(p1, "answer", { choice: "a" });
    r.dispatch(p2, "answer", { choice: "b" });
    r.dispatch(p3, "answer", { choice: "a" });
    const { envelopes } = r.dispatch(p1, "advance", {});
    expect(types(envelopes)).toContain(GameEventType.Finished);
    expect(types(envelopes)).toContain(GameEventType.ScoresFinalized);
    expect(r.isFinished()).toBe(true);
  });

  it("emits a turn per round", () => {
    const r = runner({ rounds: 2 });
    const start = r.start();
    expect(types(start.envelopes)).toContain(GameEventType.TurnStarted); // round 0
    r.dispatch(p1, "answer", { choice: "a" });
    r.dispatch(p2, "answer", { choice: "a" });
    r.dispatch(p3, "answer", { choice: "a" });
    const adv = r.dispatch(p1, "advance", {}); // -> round 1
    expect(types(adv.envelopes)).toContain(GameEventType.TurnStarted);
  });
});
