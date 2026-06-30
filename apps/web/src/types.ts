// Shapes the server pushes via the "view" message. Kept intentionally small and local: the client
// is a thin renderer of server-authoritative state and only needs the fields it displays.

export type RoomStatus = "lobby" | "playing" | "finished";

export interface LobbyPlayer {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  isHost: boolean;
}

export interface RoomSnapshot {
  status: RoomStatus;
  gameId: string | null;
  players: LobbyPlayer[];
}

export type Choice = "a" | "b";

export interface WyrView {
  phase: "answering" | "reveal" | "done";
  round: number;
  totalRounds: number;
  prompt: { a: string; b: string } | null;
  yourChoice: Choice | null;
  answeredPlayers: string[];
  reveal: { counts: { a: number; b: number }; choices: Record<string, Choice> } | null;
  scores: Record<string, number>;
}

export interface PlayerView {
  room: RoomSnapshot;
  game: WyrView | null;
}

export interface Welcome {
  playerId: string;
  code: string;
}
