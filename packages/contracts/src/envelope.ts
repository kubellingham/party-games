import { z } from "zod";

/**
 * Every fact that crosses a context boundary travels in an envelope. The envelope is the
 * stable, versioned published contract; game internals can change freely as long as the
 * envelope they emit stays compatible. Consumers must treat unknown `type`s gracefully.
 */
export const envelopeSchema = z.object({
  /** Unique id for this event instance — consumers use it for idempotency / dedupe. */
  id: z.string().min(1),
  /** Dot-namespaced discriminator, e.g. "game.finished" or "wyr.round_completed". */
  type: z.string().min(1),
  /** Schema version of `payload` for this `type`. Bump on breaking payload changes. */
  version: z.number().int().positive(),
  /** Epoch milliseconds the fact occurred (server clock). */
  occurredAt: z.number().int().nonnegative(),
  /** Per-room monotonic sequence — lets consumers order and detect gaps. */
  sequence: z.number().int().nonnegative(),
  /** Where the fact came from. */
  source: z.object({
    roomId: z.string().min(1),
    gameId: z.string().min(1),
  }),
  /** Players this fact concerns (subjects/recipients). May be empty for room-wide facts. */
  players: z.array(z.string()),
  /** Event-specific data. Validated per-type by the owning context, not here. */
  payload: z.unknown(),
});

export type EventEnvelope<TPayload = unknown> = Omit<
  z.infer<typeof envelopeSchema>,
  "payload"
> & {
  payload: TPayload;
};
