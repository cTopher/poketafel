// ── Database row types ──

export interface Trainer {
  id: number;
  name: string;
  favorite_num: number;
  created_at: string;
}

export interface OwnedPokemon {
  id: number;
  trainer_id: number;
  pokeapi_id: number;
  nickname: string | null;
  level: number;
  xp: number;
  is_active: boolean;
  caught_at: string;
}

export interface Answer {
  id: number;
  trainer_id: number;
  factor_a: number;
  factor_b: number;
  given_answer: number;
  correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface DifficultyRow {
  id: number;
  trainer_id: number;
  factor_a: number;
  factor_b: number;
  score: number;
  updated_at: string;
}

// ── API request/response types ──

export interface LoginRequest {
  name: string;
  favorite_num: number;
}

export interface LoginResponse {
  trainer: Trainer;
  token: string;
}

export interface SubmitAnswerRequest {
  factor_a: number;
  factor_b: number;
  given_answer: number;
  time_ms: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correct_answer: number;
  new_score: number;
}

export interface GameState {
  collection: OwnedPokemon[];
  difficulty: DifficultyRow[];
}

export interface CatchRequest {
  pokeapi_id: number;
  nickname?: string;
}

export interface SetActiveRequest {
  pokemon_id: number;
}

// ── Frontend game types ──

export type Screen =
  | "login"
  | "starter-select"
  | "hub"
  | "battle"
  | "battle-result"
  | "collection";

export type BattleMode = "menu" | "fight" | "catch" | "pokemon";

export interface BattleState {
  wildPokemon: WildPokemon;
  playerPokemon: OwnedPokemon;
  wildHp: number;
  wildMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  currentQuestion: Question;
  retryQueue: Question[];
  turnResult: TurnResult | null;
  canCatch: boolean;
  catchMode: boolean;
  mode: BattleMode;
  status: "active" | "won" | "lost" | "caught";
  xpGained: number;
}

export interface WildPokemon {
  pokeapiId: number;
  name: string;
  spriteUrl: string;
  cryUrl: string;
  types: string[];
}

export interface Question {
  factorA: number;
  factorB: number;
}

export interface TurnResult {
  correct: boolean;
  correctAnswer: number;
  givenAnswer: number;
  question: Question;
}

export interface BattleResult {
  outcome: "won" | "lost" | "caught";
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  evolved: boolean;
  evolvedTo: number | null;
  caughtPokemon: WildPokemon | null;
}

// ── Difficulty constants ──

export const DIFFICULTY_DEFAULT = 50;
export const DIFFICULTY_MIN = 5;
export const DIFFICULTY_WRONG_DELTA = 15;
export const DIFFICULTY_SLOW_DELTA = 3;
export const DIFFICULTY_MODERATE_DELTA = -1;
export const DIFFICULTY_FAST_DELTA = -5;
export const SLOW_THRESHOLD_MS = 10000;
export const FAST_THRESHOLD_MS = 4000;

// ── Progression constants ──

export const FLAT_DAMAGE = 10;
export const PLAYER_BASE_HP = 50;
export const HP_PER_LEVEL = 5;
export const DAMAGE_PER_LEVEL = 1;
export const XP_PER_CORRECT = 10;
export const XP_PER_WIN = 30;
export const WILD_HP_BASE = 50;
export const WILD_HP_PER_PLAYER_LEVEL = 5;
export const CATCH_HP_THRESHOLD = 0.25;

export function xpToNextLevel(level: number): number {
  return level * 25;
}
