import { useState, useCallback } from "react";
import type { BattleState, OwnedPokemon, WildPokemon, DifficultyRow } from "@shared/types";
import { createBattle, submitAnswer, attemptCatch } from "../lib/battle-engine";
import { buildDifficultyMap, pickWeightedQuestion, calculateScoreDelta, applyScoreDelta, type DifficultyMap } from "../lib/difficulty";
import { api } from "../lib/api-client";

interface UseBattleOptions {
  playerPokemon: OwnedPokemon;
  wildPokemon: WildPokemon;
  difficultyRows: DifficultyRow[];
  onBattleEnd: () => void;
}

export function useBattle({ playerPokemon, wildPokemon, difficultyRows, onBattleEnd }: UseBattleOptions) {
  const [difficultyMap] = useState<DifficultyMap>(() => buildDifficultyMap(difficultyRows));

  const [battle, setBattle] = useState<BattleState>(() => {
    const firstQuestion = pickWeightedQuestion(difficultyMap, []);
    return createBattle(playerPokemon, wildPokemon, firstQuestion);
  });

  const [answerStart, setAnswerStart] = useState(Date.now());

  // Reset timer when question changes
  const resetTimer = useCallback(() => {
    setAnswerStart(Date.now());
  }, []);

  const handleAnswer = useCallback(
    async (givenAnswer: number) => {
      const timeMs = Date.now() - answerStart;
      const { currentQuestion } = battle;
      const correct = givenAnswer === currentQuestion.factorA * currentQuestion.factorB;

      // Submit to API (fire and forget for responsiveness)
      api.submitAnswer({
        factor_a: currentQuestion.factorA,
        factor_b: currentQuestion.factorB,
        given_answer: givenAnswer,
        time_ms: timeMs,
      }).catch(() => {});

      // Update local difficulty
      const delta = calculateScoreDelta(correct, timeMs);
      applyScoreDelta(difficultyMap, currentQuestion.factorA, currentQuestion.factorB, delta);

      // Pick next question
      const nextRetryQueue = correct
        ? battle.retryQueue.filter(
            (q) => !(q.factorA === currentQuestion.factorA && q.factorB === currentQuestion.factorB)
          )
        : battle.retryQueue;
      const nextQuestion = pickWeightedQuestion(difficultyMap, nextRetryQueue);

      const newState = submitAnswer(battle, givenAnswer, nextQuestion);
      setBattle(newState);
      setAnswerStart(Date.now());

      return newState;
    },
    [battle, answerStart, difficultyMap]
  );

  const handleCatch = useCallback(
    async (givenAnswer: number) => {
      const newState = attemptCatch(battle, givenAnswer);
      setBattle(newState);

      if (newState.status === "caught") {
        await api.catchPokemon({ pokeapi_id: wildPokemon.pokeapiId });
      }

      return newState;
    },
    [battle, wildPokemon]
  );

  const enterCatchMode = useCallback(() => {
    setBattle((s) => ({ ...s, catchMode: true }));
  }, []);

  return {
    battle,
    handleAnswer,
    handleCatch,
    enterCatchMode,
  };
}
