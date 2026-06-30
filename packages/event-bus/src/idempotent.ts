import type { EventEnvelope } from "@party/contracts";
import type { EventHandler } from "./types";

/**
 * Tracks which event ids a consumer has already processed. The in-memory default is fine for
 * a single-process monolith; a durable implementation (Redis SET, a DB table) drops in here
 * when consumers move to workers, without touching the consumer logic.
 */
export interface SeenStore {
  has(eventId: string): boolean | Promise<boolean>;
  add(eventId: string): void | Promise<void>;
}

export class InMemorySeenStore implements SeenStore {
  private readonly seen = new Set<string>();
  has(eventId: string): boolean {
    return this.seen.has(eventId);
  }
  add(eventId: string): void {
    this.seen.add(eventId);
  }
}

/**
 * Wrap a handler so duplicate deliveries (an unavoidable consequence of at-least-once) become
 * no-ops. The id is recorded only after the handler succeeds, so a handler that throws will be
 * retried rather than silently skipped.
 */
export const idempotent = (
  handler: EventHandler,
  store: SeenStore = new InMemorySeenStore(),
): EventHandler => {
  return async (event: EventEnvelope) => {
    if (await store.has(event.id)) return;
    await handler(event);
    await store.add(event.id);
  };
};
