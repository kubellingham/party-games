import { useStore } from "../store";
import type { PlayerView, WyrView } from "../types";

export function Game({ view }: { view: PlayerView }) {
  const { answer, advance, leave, playerId } = useStore();
  const g = view.game;
  if (!g) return null;

  const nameOf = (id: string) => view.room.players.find((p) => p.id === id)?.name ?? id;
  const isHost = view.room.players.find((p) => p.id === playerId)?.isHost ?? false;

  return (
    <div className="card">
      <h1>Would You Rather</h1>
      <p className="muted">
        Round {Math.min(g.round + 1, g.totalRounds)} of {g.totalRounds}
      </p>

      {g.phase === "answering" && <Answering view={g} onAnswer={answer} nameOf={nameOf} />}
      {(g.phase === "reveal" || g.phase === "done") && (
        <Reveal view={g} nameOf={nameOf} />
      )}

      {g.phase === "reveal" && isHost && <button onClick={advance}>Next round</button>}
      {g.phase === "done" && (
        <>
          <h2>Final scores</h2>
          <Scores scores={g.scores} nameOf={nameOf} />
          <button className="link" onClick={leave}>
            Back to home
          </button>
        </>
      )}
    </div>
  );
}

function Answering({
  view,
  onAnswer,
  nameOf,
}: {
  view: WyrView;
  onAnswer: (c: "a" | "b") => void;
  nameOf: (id: string) => string;
}) {
  if (!view.prompt) return null;
  const answered = view.yourChoice !== null;
  return (
    <>
      <p className="prompt">Would you rather…</p>
      <div className="choices">
        <button disabled={answered} className={view.yourChoice === "a" ? "chosen" : ""} onClick={() => onAnswer("a")}>
          {view.prompt.a}
        </button>
        <button disabled={answered} className={view.yourChoice === "b" ? "chosen" : ""} onClick={() => onAnswer("b")}>
          {view.prompt.b}
        </button>
      </div>
      <p className="muted">
        {answered ? "Locked in. " : "Pick one. "}
        Answered: {view.answeredPlayers.map(nameOf).join(", ") || "nobody yet"}
      </p>
    </>
  );
}

function Reveal({ view, nameOf }: { view: WyrView; nameOf: (id: string) => string }) {
  if (!view.prompt || !view.reveal) return null;
  const { counts, choices } = view.reveal;
  const who = (c: "a" | "b") =>
    Object.entries(choices)
      .filter(([, v]) => v === c)
      .map(([id]) => nameOf(id))
      .join(", ") || "—";
  return (
    <>
      <p className="prompt">Results</p>
      <div className="choices">
        <div className="result">
          <strong>{view.prompt.a}</strong>
          <span>{counts.a} vote(s)</span>
          <span className="muted">{who("a")}</span>
        </div>
        <div className="result">
          <strong>{view.prompt.b}</strong>
          <span>{counts.b} vote(s)</span>
          <span className="muted">{who("b")}</span>
        </div>
      </div>
    </>
  );
}

function Scores({
  scores,
  nameOf,
}: {
  scores: Record<string, number>;
  nameOf: (id: string) => string;
}) {
  const rows = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return <p className="muted">No points this game.</p>;
  return (
    <ul className="players">
      {rows.map(([id, score]) => (
        <li key={id}>
          <span>{nameOf(id)}</span>
          <span>{score}</span>
        </li>
      ))}
    </ul>
  );
}
