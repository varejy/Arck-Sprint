"use client";

import Link from "next/link";
import { useGame } from "@/lib/game/GameContext";

export default function ProfilePage() {
  const {
    state,
    getDamage,
    getMaxHp,
    getSpeed,
    upgradeDamage,
    upgradeSpeed,
    upgradeHealth,
    getCost,
  } = useGame();
  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link href="/" className="chip">
          ⬅ Назад
        </Link>
        <div className="title" style={{ fontSize: 22 }}>
          Профиль
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Баланс</div>
          <div style={{ fontWeight: 800, color: "var(--primary)" }}>
            {state.currency} ⬡
          </div>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Зарабатывайте валюту, побеждая мобов
        </div>
      </div>

      <div className="col">
        <StatCard
          name="Урон"
          value={`${getDamage()}`}
          level={state.damageLevel}
          cost={getCost("damage")}
          onUpgrade={upgradeDamage}
        />
        <StatCard
          name="Скорость"
          value={`${getSpeed().toFixed(1)}`}
          level={state.speedLevel}
          cost={getCost("speed")}
          onUpgrade={upgradeSpeed}
        />
        <StatCard
          name="Жизни"
          value={`${getMaxHp()}`}
          level={state.healthLevel}
          cost={getCost("health")}
          onUpgrade={upgradeHealth}
        />
      </div>
    </main>
  );
}

function StatCard({
  name,
  value,
  level,
  cost,
  onUpgrade,
}: {
  name: string;
  value: string;
  level: number;
  cost: number;
  onUpgrade: () => void;
}) {
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Текущ.: {value} • Ур.: {level}
          </div>
        </div>
        <button className="btn" style={{ width: 160 }} onClick={onUpgrade}>
          Улучшить <br /> ({cost} ⬡)
        </button>
      </div>
    </div>
  );
}
