import { useStore } from "../store";
import type { PlayerView } from "../types";

export function Lobby({ view }: { view: PlayerView }) {
  const { code, playerId, setReady, start, leave } = useStore();
  const me = view.room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const readyCount = view.room.players.filter((p) => p.ready).length;
  const canStart = isHost && readyCount >= 2;

  return (
    <div className="card">
      <h1>
        Room <span className="code">{code}</span>
      </h1>
      <p className="muted">Share the code so friends can join. Everyone readies up to start.</p>

      <ul className="players">
        {view.room.players.map((p) => (
          <li key={p.id}>
            <span>
              {p.name}
              {p.isHost && " 👑"}
              {p.id === playerId && " (you)"}
            </span>
            <span className={p.ready ? "ready" : "muted"}>{p.ready ? "ready" : "not ready"}</span>
          </li>
        ))}
      </ul>

      <button onClick={() => setReady(!me?.ready)}>
        {me?.ready ? "Unready" : "I'm ready"}
      </button>

      {isHost && (
        <button disabled={!canStart} onClick={() => start("would-you-rather", { rounds: 5 })}>
          Start Would You Rather {canStart ? "" : "(need 2 ready)"}
        </button>
      )}

      <button className="link" onClick={leave}>
        Leave room
      </button>
    </div>
  );
}
