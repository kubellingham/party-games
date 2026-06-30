export type Choice = "a" | "b";

export interface WyrPrompt {
  readonly a: string;
  readonly b: string;
}

export type WyrPhase = "answering" | "reveal" | "done";

export interface WyrState {
  phase: WyrPhase;
  round: number;
  totalRounds: number;
  prompts: WyrPrompt[];
  /** Answers for the CURRENT round only. Kept secret until reveal. */
  answers: Record<string, Choice>;
  scores: Record<string, number>;
}

export interface WyrConfig {
  rounds: number;
  /** Optional custom prompt set; falls back to DEFAULT_PROMPTS. */
  prompts?: WyrPrompt[];
}

/** Action map MUST be a `type` alias so it satisfies GameDefinition's Record constraint. */
export type WyrActions = {
  answer: { choice: Choice };
  advance: Record<string, never>;
};
