import type { EventEnvelope } from "@party/contracts";
import type { EventBus, EventHandler, SubscribeOptions, Subscription } from "./types";

export interface InProcessBusOptions {
  /** Delivery attempts per consumer before giving up (at-least-once). Default 3. */
  readonly maxAttempts?: number;
  /** Called when a consumer still throws after `maxAttempts`. Default: console.error. */
  readonly onDeadLetter?: (event: EventEnvelope, consumer: string, error: unknown) => void;
}

interface Registration {
  readonly handler: EventHandler;
  readonly options: SubscribeOptions;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * In-memory event bus for the modular monolith. Delivers to each consumer independently with
 * bounded retries (at-least-once: a flaky consumer may see an event more than once, which is
 * why consumers should be idempotent — see {@link idempotent}). A slow or failing consumer
 * never blocks the producer beyond the publish await, and never blocks sibling consumers.
 */
export class InProcessEventBus implements EventBus {
  private readonly registrations = new Set<Registration>();
  private readonly maxAttempts: number;
  private readonly onDeadLetter: NonNullable<InProcessBusOptions["onDeadLetter"]>;

  constructor(options: InProcessBusOptions = {}) {
    this.maxAttempts = Math.max(1, options.maxAttempts ?? 3);
    this.onDeadLetter =
      options.onDeadLetter ??
      ((event, consumer, error) =>
        console.error(`[event-bus] dead-letter: consumer "${consumer}" event "${event.type}"`, error));
  }

  subscribe(handler: EventHandler, options: SubscribeOptions = {}): Subscription {
    const registration: Registration = { handler, options };
    this.registrations.add(registration);
    return { unsubscribe: () => this.registrations.delete(registration) };
  }

  async publish(event: EventEnvelope): Promise<void> {
    const deliveries: Promise<void>[] = [];
    for (const reg of this.registrations) {
      if (reg.options.types && !reg.options.types.includes(event.type)) continue;
      deliveries.push(this.deliver(reg, event));
    }
    await Promise.all(deliveries);
  }

  private async deliver(reg: Registration, event: EventEnvelope): Promise<void> {
    const name = reg.options.name ?? "anonymous";
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        await reg.handler(event);
        return;
      } catch (error) {
        if (attempt >= this.maxAttempts) {
          this.onDeadLetter(event, name, error);
          return;
        }
        await sleep(2 ** (attempt - 1)); // 1ms, 2ms, 4ms — tiny backoff, just yields the loop
      }
    }
  }
}
