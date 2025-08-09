"use client";

import Link from "next/link";
import { useGame } from "@/lib/game/GameContext";

export default function SettingsPage() {
  const { state, setDifficulty, toggleSound } = useGame();
  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link href="/" className="chip">
          ⬅ Назад
        </Link>
        <div className="title" style={{ fontSize: 22 }}>
          Настройки
        </div>
      </div>

      <div className="col">
        <div className="card">
          <div className="row">
            <div>
              <div style={{ fontWeight: 700 }}>Сложность</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Влияет на скорость и урон мобов
              </div>
            </div>
            <select
              value={state.config.difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              style={{
                background: "#0f172a",
                color: "white",
                borderRadius: 8,
                padding: "8px 10px",
                border: "1px solid #1f2937",
              }}
            >
              <option value="easy">Легко</option>
              <option value="normal">Нормально</option>
              <option value="hard">Сложно</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="row">
            <div>
              <div style={{ fontWeight: 700 }}>Звук</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Переключить звук в игре
              </div>
            </div>
            <button
              className="btn secondary"
              onClick={toggleSound}
              style={{ width: 140 }}
            >
              {state.config.soundEnabled ? "Вкл" : "Выкл"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
