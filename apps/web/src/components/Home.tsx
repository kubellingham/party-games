import { useState } from "react";
import { useStore } from "../store";

export function Home() {
  const { name, setName, createRoom, joinRoom, connecting, error } = useStore();
  const [code, setCode] = useState("");
  const ready = name.trim().length > 0;

  return (
    <div className="card">
      <h1>Party Games</h1>
      <p className="muted">Create a room or join friends with a 4-letter code.</p>

      <label>
        Your name
        <input
          value={name}
          maxLength={24}
          placeholder="e.g. Alex"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <button disabled={!ready || connecting} onClick={() => createRoom()}>
        Create a room
      </button>

      <div className="row">
        <input
          value={code}
          placeholder="CODE"
          maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button disabled={!ready || code.length < 4 || connecting} onClick={() => joinRoom(code)}>
          Join
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
