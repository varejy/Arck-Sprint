"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/lib/game/GameContext";

type Vector2 = { x: number; y: number };

type Mob = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  hue: number;
};

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pressedKeysRef = useRef<Record<string, boolean>>({});
  const joystickActiveRef = useRef(false);
  const joystickVectorRef = useRef<Vector2>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const { state, addCurrency, getDamage, getMaxHp, getSpeed } = useGame();

  const [currentHp, setCurrentHp] = useState<number>(getMaxHp());
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const playerRadius = 18;
  const attackRange = 80;
  const attackCooldownMs = 500;
  const mobBaseSpeed = useMemo(
    () =>
      state.config.difficulty === "hard"
        ? 1.3
        : state.config.difficulty === "easy"
        ? 0.8
        : 1.0,
    [state.config.difficulty]
  );
  const mobDamagePerSecond = useMemo(
    () =>
      state.config.difficulty === "hard"
        ? 18
        : state.config.difficulty === "easy"
        ? 8
        : 12,
    [state.config.difficulty]
  );

  const playerPosRef = useRef<Vector2>({ x: 200, y: 200 });
  const mobsRef = useRef<Mob[]>([]);
  const lastSpawnAtRef = useRef<number>(0);
  const lastAttackAtRef = useRef<number>(0);
  const lastFrameAtRef = useRef<number | null>(null);

  // Resize canvas to fill screen
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const dpi = globalThis.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpi);
      canvas.height = Math.floor(window.innerHeight * dpi);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Touch joystick
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    joystickActiveRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateJoystickVector(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joystickActiveRef.current || e.pointerId !== pointerIdRef.current)
      return;
    e.preventDefault();
    updateJoystickVector(e);
  };
  const onPointerUpCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.pointerId !== pointerIdRef.current) return;
    joystickActiveRef.current = false;
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {}
    pointerIdRef.current = null;
    joystickVectorRef.current = { x: 0, y: 0 };
    const stick = document.getElementById("stick");
    if (stick) stick.style.transform = "translate(-50%, -50%)";
  };

  function updateJoystickVector(e: React.PointerEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    const len = Math.hypot(dx, dy) || 1;
    const max = rect.width * 0.45;
    // clamp length to max radius for stick position
    const clampedX = Math.max(-max, Math.min(max, dx));
    const clampedY = Math.max(-max, Math.min(max, dy));
    const nx = clampedX / max;
    const ny = clampedY / max;
    joystickVectorRef.current = { x: nx, y: ny };
    const stick = document.getElementById("stick");
    if (stick)
      stick.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
  }

  // Derived stats reactivity
  useEffect(() => {
    setCurrentHp((hp) => Math.min(hp, getMaxHp()));
  }, [getMaxHp]);

  // Game loop
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx = canvas.getContext("2d")!;

    function spawnMob(now: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      // Spawn on edges
      const edge = Math.floor(Math.random() * 4);
      let x = 0,
        y = 0;
      if (edge === 0) {
        x = Math.random() * w;
        y = -20;
      } else if (edge === 1) {
        x = w + 20;
        y = Math.random() * h;
      } else if (edge === 2) {
        x = Math.random() * w;
        y = h + 20;
      } else {
        x = -20;
        y = Math.random() * h;
      }
      const px = playerPosRef.current.x;
      const py = playerPosRef.current.y;
      const dirx = px - x,
        diry = py - y;
      const len = Math.hypot(dirx, diry) || 1;
      const speed = (0.6 + Math.random() * 0.6) * mobBaseSpeed;
      const radius = 16 + Math.random() * 8;
      const hp = 30 + Math.random() * 40;
      mobsRef.current.push({
        id: now + Math.random(),
        x,
        y,
        vx: (dirx / len) * speed,
        vy: (diry / len) * speed,
        radius,
        hp,
        maxHp: hp,
        speed,
        hue: Math.floor(Math.random() * 360),
      });
    }

    function update(now: number) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // delta time
      const last = lastFrameAtRef.current ?? now;
      const dt = Math.min(50, now - last);
      lastFrameAtRef.current = now;
      if (isPaused || isGameOver) return draw();

      // Movement input
      let inputX = 0,
        inputY = 0;
      const k = pressedKeysRef.current;
      if (k["arrowup"] || k["w"]) inputY -= 1;
      if (k["arrowdown"] || k["s"]) inputY += 1;
      if (k["arrowleft"] || k["a"]) inputX -= 1;
      if (k["arrowright"] || k["d"]) inputX += 1;
      inputX += joystickVectorRef.current.x;
      inputY += joystickVectorRef.current.y;
      const mag = Math.hypot(inputX, inputY) || 1;
      const nx = inputX / mag;
      const ny = inputY / mag;
      const speed = getSpeed();
      playerPosRef.current.x = Math.max(
        playerRadius,
        Math.min(w - playerRadius, playerPosRef.current.x + nx * speed)
      );
      playerPosRef.current.y = Math.max(
        playerRadius,
        Math.min(h - playerRadius, playerPosRef.current.y + ny * speed)
      );

      // Spawn mobs
      const spawnInterval =
        state.config.difficulty === "hard"
          ? 700
          : state.config.difficulty === "easy"
          ? 1400
          : 1000;
      if (now - lastSpawnAtRef.current > spawnInterval) {
        lastSpawnAtRef.current = now;
        spawnMob(now);
      }

      // Update mobs
      const px = playerPosRef.current.x;
      const py = playerPosRef.current.y;
      for (const m of mobsRef.current) {
        const dirx = px - m.x,
          diry = py - m.y;
        const len = Math.hypot(dirx, diry) || 1;
        m.vx = (dirx / len) * m.speed;
        m.vy = (diry / len) * m.speed;
        m.x += m.vx;
        m.y += m.vy;
      }

      // Combat: auto attack nearest in range
      const nowMs = now;
      if (
        nowMs - lastAttackAtRef.current > attackCooldownMs &&
        mobsRef.current.length
      ) {
        let nearest: Mob | null = null;
        let nearestDist = Infinity;
        for (const m of mobsRef.current) {
          const d = Math.hypot(px - m.x, py - m.y);
          if (d < nearestDist) {
            nearest = m;
            nearestDist = d;
          }
        }
        if (nearest && nearestDist <= attackRange) {
          nearest.hp -= getDamage();
          lastAttackAtRef.current = nowMs;
        }
      }

      // Collisions damage to player
      let damageTaken = 0;
      for (const m of mobsRef.current) {
        const d = Math.hypot(px - m.x, py - m.y);
        if (d < m.radius + playerRadius) {
          damageTaken += (mobDamagePerSecond * dt) / 1000;
        }
      }
      if (damageTaken > 0) {
        setCurrentHp((hp) => {
          const nhp = Math.max(0, hp - damageTaken);
          if (nhp <= 0) setIsGameOver(true);
          return nhp;
        });
      }

      // Remove dead mobs and award currency
      const before = mobsRef.current.length;
      mobsRef.current = mobsRef.current.filter((m) => m.hp > 0);
      const killed = before - mobsRef.current.length;
      if (killed > 0) addCurrency(killed * 5);

      draw();
    }

    function draw() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.fillStyle = "#08101a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      const grid = 48;
      for (let x = 0; x < w; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Attack range
      ctx.beginPath();
      ctx.arc(
        playerPosRef.current.x,
        playerPosRef.current.y,
        attackRange,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(34,211,238,0.15)";
      ctx.stroke();

      // Player
      ctx.beginPath();
      const grad = ctx.createRadialGradient(
        playerPosRef.current.x - 6,
        playerPosRef.current.y - 6,
        6,
        playerPosRef.current.x,
        playerPosRef.current.y,
        playerRadius
      );
      grad.addColorStop(0, "#22d3ee");
      grad.addColorStop(1, "#0ea5b7");
      ctx.fillStyle = grad;
      ctx.arc(
        playerPosRef.current.x,
        playerPosRef.current.y,
        playerRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Player HP bar
      const maxHp = getMaxHp();
      const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));
      const barW = 80;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(
        playerPosRef.current.x - barW / 2,
        playerPosRef.current.y - playerRadius - 16,
        barW,
        8
      );
      ctx.fillStyle =
        hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(
        playerPosRef.current.x - barW / 2,
        playerPosRef.current.y - playerRadius - 16,
        barW * hpRatio,
        8
      );

      // Mobs
      for (const m of mobsRef.current) {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${m.hue}, 70%, 55%)`;
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        const r = Math.max(0, Math.min(1, m.hp / m.maxHp));
        const mw = m.radius * 2;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(m.x - m.radius, m.y - m.radius - 10, mw, 6);
        ctx.fillStyle = r > 0.5 ? "#22c55e" : r > 0.25 ? "#f59e0b" : "#ef4444";
        ctx.fillRect(m.x - m.radius, m.y - m.radius - 10, mw * r, 6);
      }

      // HUD overlay is handled by DOM elements
    }

    const loop = (now: number) => {
      update(now);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    addCurrency,
    getDamage,
    getMaxHp,
    getSpeed,
    isGameOver,
    isPaused,
    mobBaseSpeed,
    mobDamagePerSecond,
    state.config.difficulty,
  ]);

  return (
    <div className="gameRoot">
      <div className="hud">
        <Link href="/" className="chip">
          ⬅ Меню
        </Link>
        <div className="chip">
          HP: {Math.round(currentHp)} / {getMaxHp()}
        </div>
        <div className="chip">⬡ {state.currency}</div>
        <button className="chip" onClick={() => setIsPaused((p) => !p)}>
          {isPaused ? "▶ Продолжить" : "⏸ Пауза"}
        </button>
      </div>
      <canvas ref={canvasRef} className="gameCanvas" />

      {/* Joystick */}
      <div
        className="joystickWrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpCancel}
        onPointerCancel={onPointerUpCancel}
      >
        <div className="joystickBase" />
        <div id="stick" className="joystickStick" />
      </div>

      {isGameOver && (
        <div className="overlay">
          <div className="card" style={{ width: 320, textAlign: "center" }}>
            <div className="title" style={{ fontSize: 22, marginBottom: 8 }}>
              Игра окончена
            </div>
            <div style={{ color: "var(--muted)", marginBottom: 16 }}>
              Вы заработали ⬡ {state.currency}
            </div>
            <div className="col">
              <button
                className="btn"
                onClick={() => {
                  setCurrentHp(getMaxHp());
                  setIsGameOver(false);
                  mobsRef.current = [];
                }}
              >
                Заново
              </button>
              <Link href="/" className="btn secondary">
                В меню
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
