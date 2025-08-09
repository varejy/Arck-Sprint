"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

type Difficulty = "easy" | "normal" | "hard";

type GameConfig = {
  difficulty: Difficulty;
  soundEnabled: boolean;
};

type GameState = {
  currency: number;
  damageLevel: number;
  speedLevel: number;
  healthLevel: number;
  config: GameConfig;
};

type GameAction =
  | { type: "ADD_CURRENCY"; amount: number }
  | { type: "SPEND_CURRENCY"; amount: number }
  | { type: "UPGRADE"; stat: "damage" | "speed" | "health" }
  | { type: "SET_DIFFICULTY"; value: Difficulty }
  | { type: "TOGGLE_SOUND" }
  | { type: "HYDRATE"; state: GameState };

const STORAGE_KEY = "next-game-state-v1";

const initialState: GameState = {
  currency: 0,
  damageLevel: 0,
  speedLevel: 0,
  healthLevel: 0,
  config: { difficulty: "normal", soundEnabled: true },
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_CURRENCY":
      return { ...state, currency: state.currency + action.amount };
    case "SPEND_CURRENCY":
      return {
        ...state,
        currency: Math.max(0, state.currency - action.amount),
      };
    case "UPGRADE": {
      if (action.stat === "damage")
        return { ...state, damageLevel: state.damageLevel + 1 };
      if (action.stat === "speed")
        return { ...state, speedLevel: state.speedLevel + 1 };
      return { ...state, healthLevel: state.healthLevel + 1 };
    }
    case "SET_DIFFICULTY":
      return {
        ...state,
        config: { ...state.config, difficulty: action.value },
      };
    case "TOGGLE_SOUND":
      return {
        ...state,
        config: { ...state.config, soundEnabled: !state.config.soundEnabled },
      };
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

type GameContextType = {
  state: GameState;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  upgradeDamage: () => void;
  upgradeSpeed: () => void;
  upgradeHealth: () => void;
  setDifficulty: (d: Difficulty) => void;
  toggleSound: () => void;
  getDamage: () => number;
  getSpeed: () => number;
  getMaxHp: () => number;
  getCost: (stat: "damage" | "speed" | "health") => number;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const addCurrency = useCallback(
    (amount: number) => dispatch({ type: "ADD_CURRENCY", amount }),
    []
  );
  const spendCurrency = useCallback(
    (amount: number) => {
      if (state.currency < amount) return false;
      dispatch({ type: "SPEND_CURRENCY", amount });
      return true;
    },
    [state.currency]
  );

  const base = { damage: 10, speed: 3.2, hp: 100 };
  const inc = { damage: 5, speed: 0.4, hp: 20 };
  const costBase = { damage: 20, speed: 20, health: 20 };

  const getDamage = useCallback(
    () => base.damage + state.damageLevel * inc.damage,
    [state.damageLevel]
  );
  const getSpeed = useCallback(
    () => base.speed + state.speedLevel * inc.speed,
    [state.speedLevel]
  );
  const getMaxHp = useCallback(
    () => base.hp + state.healthLevel * inc.hp,
    [state.healthLevel]
  );

  const getCost = useCallback(
    (stat: "damage" | "speed" | "health") => {
      const level =
        stat === "damage"
          ? state.damageLevel
          : stat === "speed"
          ? state.speedLevel
          : state.healthLevel;
      const baseCost = costBase[stat];
      return Math.floor(baseCost * Math.pow(1.7, level));
    },
    [state.damageLevel, state.speedLevel, state.healthLevel]
  );

  const tryUpgrade = useCallback(
    (stat: "damage" | "speed" | "health") => {
      const cost = ((): number => {
        const level =
          stat === "damage"
            ? state.damageLevel
            : stat === "speed"
            ? state.speedLevel
            : state.healthLevel;
        const baseCost = costBase[stat];
        return Math.floor(baseCost * Math.pow(1.7, level));
      })();
      if (!spendCurrency(cost)) return;
      dispatch({ type: "UPGRADE", stat });
    },
    [spendCurrency, state.damageLevel, state.speedLevel, state.healthLevel]
  );

  const value = useMemo<GameContextType>(
    () => ({
      state,
      addCurrency,
      spendCurrency,
      upgradeDamage: () => tryUpgrade("damage"),
      upgradeSpeed: () => tryUpgrade("speed"),
      upgradeHealth: () => tryUpgrade("health"),
      setDifficulty: (d: Difficulty) =>
        dispatch({ type: "SET_DIFFICULTY", value: d }),
      toggleSound: () => dispatch({ type: "TOGGLE_SOUND" }),
      getDamage,
      getSpeed,
      getMaxHp,
      getCost,
    }),
    [
      state,
      addCurrency,
      spendCurrency,
      tryUpgrade,
      getDamage,
      getSpeed,
      getMaxHp,
      getCost,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
