import type { EventBus } from "@party/event-bus";
import type { AnyGameDefinition } from "@party/engine";

/**
 * Dependencies the Colyseus room needs, injected by the composition root. Colyseus instantiates
 * rooms itself, so we hand dependencies through this module-level holder rather than a constructor
 * — and rather than room options, which a client could otherwise spoof over the wire.
 */
export interface RoomDeps {
  bus: EventBus;
  registry: Record<string, AnyGameDefinition>;
}

let deps: RoomDeps | null = null;

export const setRoomDeps = (next: RoomDeps): void => {
  deps = next;
};

export const getRoomDeps = (): RoomDeps => {
  if (!deps) throw new Error("room deps not initialised");
  return deps;
};
