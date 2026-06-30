import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { InProcessEventBus } from "@party/event-bus";
import { registerProgression, type ProgressionService } from "@party/platform-profile";
import { GAME_REGISTRY, listGames } from "./game-registry";
import { registerAnalytics } from "./analytics";
import { LobbyRoom } from "./lobby-room";
import { setRoomDeps } from "./room-deps";

export interface RunningServer {
  gameServer: Server;
  progression: ProgressionService;
  stop(): Promise<void>;
}

/**
 * Build and start the whole platform process. This is the composition root: the one place that
 * knows every bounded context. It builds the event bus, subscribes the platform consumers
 * (progression, analytics), injects deps into the realtime room, and exposes a small REST surface
 * for read models. Producers and consumers never reference each other — they meet only here.
 */
export async function startServer(port: number): Promise<RunningServer> {
  const bus = new InProcessEventBus();
  const { service: progression } = registerProgression(bus);
  registerAnalytics(bus);

  setRoomDeps({ bus, registry: GAME_REGISTRY });

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/games", (_req, res) => res.json(listGames()));
  app.get("/players/:id/progress", (req, res) => res.json(progression.get(req.params.id)));

  const httpServer = http.createServer(app);
  const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
  gameServer.define("lobby", LobbyRoom);

  await gameServer.listen(port);

  return {
    gameServer,
    progression,
    stop: () => gameServer.gracefullyShutdown(false),
  };
}
