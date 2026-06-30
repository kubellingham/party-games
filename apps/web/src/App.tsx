import { useStore } from "./store";
import { Home } from "./components/Home";
import { Lobby } from "./components/Lobby";
import { Game } from "./components/Game";

export function App() {
  const { room, view } = useStore();

  if (!room || !view) return <Home />;
  if (view.room.status === "lobby") return <Lobby view={view} />;
  return <Game view={view} />;
}
