import type { AnyGameDefinition } from "@party/engine";
import { wouldYouRather } from "@party/game-would-you-rather";

/**
 * The composition root's catalogue of playable games. Adding a game to the platform = importing
 * its module and adding one line here. Nothing else in the server changes.
 */
export const GAME_REGISTRY: Record<string, AnyGameDefinition> = {
  [wouldYouRather.id]: wouldYouRather as unknown as AnyGameDefinition,
};

export const listGames = (): Array<{ id: string; name: string; minPlayers: number; maxPlayers: number }> =>
  Object.values(GAME_REGISTRY).map((g) => ({ id: g.id, ...g.meta }));
