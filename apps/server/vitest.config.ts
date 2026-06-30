import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Colyseus core pulls in @pm2/io, which attaches handlers to the Node child_process IPC
    // channel and corrupts vitest's default "forks" pool messaging. worker_threads use a
    // MessagePort instead, so the realtime server boots cleanly inside tests.
    pool: "threads",
  },
});
