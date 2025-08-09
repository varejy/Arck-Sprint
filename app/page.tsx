"use client";
import Link from "next/link";
import { useGame } from "@/lib/game/GameContext";

export default function HomePage() {
  // Client selector wrapper
  return (
    <main className="menu container">
      <div className="title">Arca Sprint</div>
      <p style={{ color: "var(--muted)", marginTop: -8 }}>
        Мобильная игра на Next.js
      </p>
      <Link href="/game" className="btn" prefetch>
        Начать игру
      </Link>
      <Link href="/profile" className="btn secondary" prefetch>
        Профиль персонажа
      </Link>
      <Link href="/settings" className="btn secondary" prefetch>
        Настройки
      </Link>
      <CurrencyPreview />
    </main>
  );
}

function CurrencyPreview() {
  // Small client hook to show currency on main menu
  const { state } = useGame();
  return (
    <div className="card" style={{ width: "100%", maxWidth: 360 }}>
      <div className="row">
        <div style={{ fontWeight: 700 }}>Баланс</div>
        <div style={{ fontWeight: 800, color: "var(--primary)" }}>
          {state.currency} ⬡
        </div>
      </div>
    </div>
  );
}
