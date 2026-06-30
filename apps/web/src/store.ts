import { create } from "zustand";
import { Client, type Room } from "colyseus.js";
import type { Choice, PlayerView, Welcome } from "./types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "ws://localhost:2567";

/** Persist a stable guest id so a refresh / brief disconnect keeps the same identity. */
function guestId(): string {
  const KEY = "party.guestId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

interface GameStore {
  client: Client;
  room: Room | null;
  view: PlayerView | null;
  code: string | null;
  playerId: string | null;
  name: string;
  error: string | null;
  connecting: boolean;

  setName: (name: string) => void;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  setReady: (ready: boolean) => void;
  start: (gameId: string, config?: unknown) => void;
  answer: (choice: Choice) => void;
  advance: () => void;
  leave: () => void;
}

export const useStore = create<GameStore>((set, get) => {
  const wire = (room: Room) => {
    room.onMessage<Welcome>("welcome", (w) => set({ code: w.code, playerId: w.playerId }));
    room.onMessage<PlayerView>("view", (v) => set({ view: v }));
    room.onMessage<{ message: string }>("error", (e) => set({ error: e.message }));
    room.onLeave(() => set({ room: null, view: null, code: null }));
  };

  return {
    client: new Client(SERVER_URL),
    room: null,
    view: null,
    code: null,
    playerId: null,
    name: localStorage.getItem("party.name") ?? "",
    error: null,
    connecting: false,

    setName: (name) => {
      localStorage.setItem("party.name", name);
      set({ name });
    },

    createRoom: async () => {
      set({ connecting: true, error: null });
      try {
        const room = await get().client.create("lobby", { name: get().name, playerId: guestId() });
        wire(room);
        set({ room });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "could not create room" });
      } finally {
        set({ connecting: false });
      }
    },

    joinRoom: async (code) => {
      set({ connecting: true, error: null });
      try {
        const room = await get().client.joinById(code.toUpperCase(), {
          name: get().name,
          playerId: guestId(),
        });
        wire(room);
        set({ room });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : "could not join room" });
      } finally {
        set({ connecting: false });
      }
    },

    setReady: (ready) => get().room?.send("ready", { ready }),
    start: (gameId, config) => get().room?.send("start", { gameId, config }),
    answer: (choice) => get().room?.send("action", { action: "answer", payload: { choice } }),
    advance: () => get().room?.send("action", { action: "advance", payload: {} }),
    leave: () => {
      void get().room?.leave();
      set({ room: null, view: null, code: null });
    },
  };
});
