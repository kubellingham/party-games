import type { EventEnvelope } from "@party/contracts";

export type EventHandler = (event: EventEnvelope) => void | Promise<void>;

export interface SubscribeOptions {
  /**
   * Restrict delivery to these exact event types. Omit to receive the full firehose
   * (what an analytics sink wants). A consumer that only understands a few types should
   * list them so unknown events never reach it.
   */
  readonly types?: readonly string[];
  /** Label used in logs / dead-letter reporting. */
  readonly name?: string;
}

export interface Subscription {
  unsubscribe(): void;
}

/**
 * The seam between producers (the engine) and consumers (platform contexts). The in-process
 * implementation is the MVP; a Redis Streams / NATS implementation can replace it later
 * without any producer or consumer changing, because both only depend on this interface.
 */
export interface EventBus {
  publish(event: EventEnvelope): Promise<void>;
  subscribe(handler: EventHandler, options?: SubscribeOptions): Subscription;
}
