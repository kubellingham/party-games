import { startServer } from "./server";

const PORT = Number(process.env.PORT ?? 2567);

startServer(PORT)
  .then(() => {
    console.log(`[server] listening on http://localhost:${PORT}  (ws lobby room: "lobby")`);
  })
  .catch((err) => {
    console.error("[server] fatal", err);
    process.exit(1);
  });
