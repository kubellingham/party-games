import type { GameDefinition } from "@party/engine";
import { DEFAULT_PROMPTS } from "./prompts";
import type { Choice, WyrActions, WyrConfig, WyrPrompt, WyrState } from "./types";

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

function tally(answers: Record<string, Choice>): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const choice of Object.values(answers)) {
    if (choice === "a") a++;
    else b++;
  }
  return { a, b };
}

/**
 * Would You Rather — the simplest interesting shape: every player answers the SAME prompt
 * simultaneously, answers are hidden until everyone has locked in, then revealed together.
 * It is the Phase 1 driver that proves the whole pipe (lobby -> engine -> events -> consumer)
 * and the hidden-information half of `projectView` (you must not see others' answers early).
 */
export const wouldYouRather: GameDefinition<WyrState, WyrConfig, WyrActions> = {
  id: "would-you-rather",
  meta: { name: "Would You Rather", minPlayers: 2, maxPlayers: 12 },
  defaultConfig: { rounds: 5 },

  setup(_players, config, random) {
    const pool: WyrPrompt[] = config.prompts?.length ? config.prompts : [...DEFAULT_PROMPTS];
    const prompts = shuffle(pool, random).slice(0, Math.max(1, config.rounds));
    return {
      phase: "answering",
      round: 0,
      totalRounds: prompts.length,
      prompts,
      answers: {},
      scores: {},
    };
  },

  actions: {
    answer: {
      validate(ctx, player, action) {
        if (ctx.state.phase !== "answering") return "not accepting answers right now";
        if (ctx.state.answers[player]) return "you already answered";
        if (action.choice !== "a" && action.choice !== "b") return "invalid choice";
      },
      reduce(ctx, player, action) {
        const answers = { ...ctx.state.answers, [player]: action.choice };
        const everyoneAnswered = ctx.players.every((p) => answers[p]);
        if (!everyoneAnswered) {
          return {
            state: { ...ctx.state, answers },
            // Announce progress WITHOUT leaking the choice.
            events: [{ type: "wyr.answered", payload: { player: String(player) } }],
          };
        }
        // Everyone is in: reveal and score the majority side.
        const counts = tally(answers);
        const majority: Choice | null = counts.a === counts.b ? null : counts.a > counts.b ? "a" : "b";
        const scores = { ...ctx.state.scores };
        if (majority) {
          for (const [p, c] of Object.entries(answers)) {
            if (c === majority) scores[p] = (scores[p] ?? 0) + 1;
          }
        }
        return {
          state: { ...ctx.state, answers, scores, phase: "reveal" },
          events: [
            {
              type: "wyr.round_revealed",
              payload: { round: ctx.state.round, counts, majority },
            },
          ],
        };
      },
    },

    advance: {
      validate(ctx) {
        if (ctx.state.phase !== "reveal") return "can only advance after a reveal";
      },
      reduce(ctx) {
        const nextRound = ctx.state.round + 1;
        if (nextRound >= ctx.state.totalRounds) {
          return { state: { ...ctx.state, phase: "done" } };
        }
        return { state: { ...ctx.state, phase: "answering", round: nextRound, answers: {} } };
      },
    },
  },

  // Each round is a turn; phase changes within a round keep the same turn number, so reveal
  // does not spuriously emit turn_started — only moving to the next round does.
  currentTurn(state) {
    if (state.phase === "done") return null;
    return { turn: state.round, activePlayers: [] };
  },

  projectView(ctx, player) {
    const s = ctx.state;
    const revealed = s.phase === "reveal" || s.phase === "done";
    return {
      phase: s.phase,
      round: s.round,
      totalRounds: s.totalRounds,
      prompt: s.prompts[s.round] ?? null,
      yourChoice: s.answers[player] ?? null,
      // Who has answered — but never WHAT they answered, until the reveal.
      answeredPlayers: Object.keys(s.answers),
      reveal: revealed ? { counts: tally(s.answers), choices: s.answers } : null,
      scores: s.scores,
    };
  },

  isOver(state) {
    return state.phase === "done";
  },

  finalScores(state) {
    return state.scores;
  },
};
