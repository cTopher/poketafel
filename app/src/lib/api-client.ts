import type {
  LoginRequest, LoginResponse, SubmitAnswerRequest, SubmitAnswerResponse,
  GameState, CatchRequest, OwnedPokemon,
} from "@shared/types";

const TOKEN_KEY = "poketafel_token";
const TRAINER_KEY = "poketafel_trainer";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string, trainer: LoginResponse["trainer"]) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TRAINER_KEY, JSON.stringify(trainer));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TRAINER_KEY);
}

export function getSavedTrainer(): LoginResponse["trainer"] | null {
  const raw = localStorage.getItem(TRAINER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  login(data: LoginRequest) {
    return apiFetch<LoginResponse>("/api/login", { method: "POST", body: JSON.stringify(data) });
  },
  loadGameState() {
    return apiFetch<GameState>("/api/save");
  },
  submitAnswer(data: SubmitAnswerRequest) {
    return apiFetch<SubmitAnswerResponse>("/api/battle", { method: "POST", body: JSON.stringify(data) });
  },
  catchPokemon(data: CatchRequest) {
    return apiFetch<OwnedPokemon>("/api/pokemon", { method: "POST", body: JSON.stringify(data) });
  },
  updatePokemon(data: { pokemon_id: number; set_active?: boolean; xp?: number; level?: number }) {
    return apiFetch<OwnedPokemon>("/api/pokemon", { method: "PUT", body: JSON.stringify(data) });
  },
  getCollection() {
    return apiFetch<OwnedPokemon[]>("/api/pokemon");
  },
};
