import { useState, useEffect, useCallback } from "react";
import type { Trainer, OwnedPokemon, DifficultyRow } from "@shared/types";
import {
  api,
  saveSession,
  clearSession,
  getSavedTrainer,
} from "../lib/api-client";

interface AuthState {
  trainer: Trainer | null;
  collection: OwnedPokemon[];
  difficulty: DifficultyRow[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    trainer: null,
    collection: [],
    difficulty: [],
    loading: true,
  });

  useEffect(() => {
    const saved = getSavedTrainer();
    if (saved) {
      api
        .loadGameState()
        .then((gameState) => {
          setState({
            trainer: saved,
            collection: gameState.collection,
            difficulty: gameState.difficulty,
            loading: false,
          });
        })
        .catch(() => {
          clearSession();
          setState((s) => ({ ...s, loading: false }));
        });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (name: string, favoriteNum: number) => {
    const { trainer, token } = await api.login({
      name,
      favorite_num: favoriteNum,
    });
    saveSession(token, trainer);
    const gameState = await api.loadGameState();
    setState({
      trainer,
      collection: gameState.collection,
      difficulty: gameState.difficulty,
      loading: false,
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setState({ trainer: null, collection: [], difficulty: [], loading: false });
  }, []);

  const updateCollection = useCallback((collection: OwnedPokemon[]) => {
    setState((s) => ({ ...s, collection }));
  }, []);

  const updateDifficulty = useCallback((difficulty: DifficultyRow[]) => {
    setState((s) => ({ ...s, difficulty }));
  }, []);

  return {
    ...state,
    login,
    logout,
    updateCollection,
    updateDifficulty,
    hasStarter: state.collection.length > 0,
  };
}
