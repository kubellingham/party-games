import type { WyrPrompt } from "./types";

/** Default seed prompts. Later this moves behind a content service / CMS (see roadmap). */
export const DEFAULT_PROMPTS: readonly WyrPrompt[] = [
  { a: "be able to fly", b: "be invisible" },
  { a: "have unlimited money", b: "have unlimited time" },
  { a: "always be 10 minutes late", b: "always be 20 minutes early" },
  { a: "live without music", b: "live without movies" },
  { a: "be a famous actor", b: "be a famous scientist" },
  { a: "explore space", b: "explore the ocean" },
  { a: "have a rewind button", b: "have a pause button for your life" },
  { a: "never use social media again", b: "never watch TV again" },
];
