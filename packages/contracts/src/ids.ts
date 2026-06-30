/**
 * Branded id types. They are strings at runtime but distinct at compile time, so a
 * `RoomId` can never be accidentally passed where a `PlayerId` is expected.
 */
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type PlayerId = Brand<string, "PlayerId">;
export type RoomId = Brand<string, "RoomId">;
export type GameId = string; // game *type* identifier, e.g. "would-you-rather" — not branded

export const PlayerId = (id: string): PlayerId => id as PlayerId;
export const RoomId = (id: string): RoomId => id as RoomId;

/** Generate a new unique id. Available in Node 19+ and modern browsers. */
export const newId = (): string => crypto.randomUUID();
