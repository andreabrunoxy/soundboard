import { useEffect, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import "./App.css";

const KEY = "sounds";

export default function App() {
  const [sounds, setSounds] = useState([]); // {id, name, blob}
  const [playing, setPlaying] = useState(new Set());
  const [edit, setEdit] = useState(false);
  const players = useRef(new Map());

  useEffect(() => {
    get(KEY).then((s) => s && setSounds(s));
  }, []);

  const save = (next) => {
    setSounds(next);
    set(KEY, next);
  };

  const setFlag = (id, on) =>
    setPlaying((p) => {
      const n = new Set(p);
      on ? n.add(id) : n.delete(id);
      return n;
    });

  const getPlayer = (s) => {
    let a = players.current.get(s.id);
    if (!a) {
      a = new Audio(URL.createObjectURL(s.blob));
      a.onended = () => setFlag(s.id, false);
      players.current.set(s.id, a);
    }
    return a;
  };

  const toggle = (s) => {
    const a = getPlayer(s);
    if (a.paused) {
      a.play();
      setFlag(s.id, true);
    } else {
      a.pause();
      a.currentTime = 0;
      setFlag(s.id, false);
    }
  };

  const addFiles = (e) => {
    const added = [...e.target.files].map((f) => ({
      id: crypto.randomUUID(),
      name: f.name.replace(/\.[^.]+$/, ""),
      blob: f,
    }));
    save([...sounds, ...added]);
    e.target.value = "";
  };

  const remove = (s) => {
    if (!confirm(`Eliminare "${s.name}"?`)) return;
    players.current.get(s.id)?.pause();
    players.current.delete(s.id);
    save(sounds.filter((x) => x.id !== s.id));
  };

  return (
    <main>
      <header>
        <label className="btn">
          + Aggiungi
          <input
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={addFiles}
          />
        </label>
        <button className="btn" onClick={() => setEdit(!edit)}>
          {edit ? "Fatto" : "Modifica"}
        </button>
      </header>

      {!sounds.length && (
        <p className="empty">Nessun suono. Premi "+ Aggiungi".</p>
      )}

      <div className="grid">
        {sounds.map((s) => (
          <button
            key={s.id}
            className={
              "pad" + (playing.has(s.id) ? " on" : "") + (edit ? " edit" : "")
            }
            onClick={() => (edit ? remove(s) : toggle(s))}
          >
            {edit && "🗑 "}
            {s.name}
          </button>
        ))}
      </div>
    </main>
  );
}
