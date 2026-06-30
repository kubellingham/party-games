import type { EventBus, Subscription } from "@party/event-bus";

/**
 * The Analytics context: a firehose consumer (no type filter) that records every fact. Here it
 * just logs; later it writes to a warehouse. It demonstrates that a context can consume the full
 * event stream — including game-specific events it doesn't model — without any producer change.
 */
export function registerAnalytics(bus: EventBus): Subscription {
  return bus.subscribe(
    (event) => {
      console.log(
        `[analytics] ${event.type} room=${event.source.roomId} game=${event.source.gameId} seq=${event.sequence}`,
      );
    },
    { name: "analytics" },
  );
}
