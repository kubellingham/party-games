import { type EventBus, type Subscription, idempotent } from "@party/event-bus";
import { ProgressionService } from "./progression";

export * from "./progression";

/**
 * Wire the Progression context onto the bus. This is the ONLY coupling point — and it lives in
 * the composition root's call to this function, not in any game. The handler is idempotent so
 * at-least-once redelivery never double-awards XP.
 */
export function registerProgression(
  bus: EventBus,
  service: ProgressionService = new ProgressionService(),
): { service: ProgressionService; subscription: Subscription } {
  const subscription = bus.subscribe(idempotent((event) => service.handle(event)), {
    name: "progression",
    types: ProgressionService.SUBSCRIBED,
  });
  return { service, subscription };
}
