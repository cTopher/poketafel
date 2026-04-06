import { useState, useCallback } from "react";
import type {
  BattleState,
  BattleMode,
  OwnedPokemon,
  WildPokemon,
  DifficultyRow,
} from "@shared/types";
import {
  createBattle,
  submitAnswer,
  attemptCatch,
  applyFreeDamage,
} from "../lib/battle-engine";
import {
  buildDifficultyMap,
  pickWeightedQuestion,
  calculateScoreDelta,
  applyScoreDelta,
  generateChoices,
  type DifficultyMap,
} from "../lib/difficulty";
import { api } from "../lib/api-client";

interface UseBattleOptions {
  playerPokemon: OwnedPokemon;
  wildPokemon: WildPokemon;
  difficultyRows: DifficultyRow[];
}

export function useBattle({
  playerPokemon,
  wildPokemon,
  difficultyRows,
}: UseBattleOptions) {
  const [difficultyMap] = useState<DifficultyMap>(() =>
    buildDifficultyMap(difficultyRows),
  );

  const [battle, setBattle] = useState<BattleState>(() => {
    const firstQuestion = pickWeightedQuestion(difficultyMap, []);
    return createBattle(playerPokemon, wildPokemon, firstQuestion);
  });

  const [choices, setChoices] = useState<number[]>(() =>
    generateChoices(
      battle.currentQuestion.factorA,
      battle.currentQuestion.factorB,
    ),
  );

  const [answerStart, setAnswerStart] = useState(() => Date.now());

  const setMode = useCallback((mode: BattleMode) => {
    setBattle((s) => ({ ...s, mode }));
  }, []);

  const enterFight = useCallback(() => {
    const ch = generateChoices(
      battle.currentQuestion.factorA,
      battle.currentQuestion.factorB,
    );
    setChoices(ch);
    setBattle((s) => ({ ...s, mode: "fight" }));
    setAnswerStart(Date.now());
  }, [battle.currentQuestion]);

  const enterCatch = useCallback(() => {
    const ch = generateChoices(
      battle.currentQuestion.factorA,
      battle.currentQuestion.factorB,
    );
    setChoices(ch);
    setBattle((s) => ({ ...s, mode: "catch", catchMode: true }));
    setAnswerStart(Date.now());
  }, [battle.currentQuestion]);

  const handleAnswer = useCallback(
    (givenAnswer: number) => {
      const timeMs = Date.now() - answerStart;
      const { currentQuestion } = battle;
      const correct =
        givenAnswer === currentQuestion.factorA * currentQuestion.factorB;

      api
        .submitAnswer({
          factor_a: currentQuestion.factorA,
          factor_b: currentQuestion.factorB,
          given_answer: givenAnswer,
          time_ms: timeMs,
        })
        .catch(() => {});

      const delta = calculateScoreDelta(correct, timeMs);
      applyScoreDelta(
        difficultyMap,
        currentQuestion.factorA,
        currentQuestion.factorB,
        delta,
      );

      const nextRetryQueue = correct
        ? battle.retryQueue.filter(
            (q) =>
              !(
                q.factorA === currentQuestion.factorA &&
                q.factorB === currentQuestion.factorB
              ),
          )
        : battle.retryQueue;
      const nextQuestion = pickWeightedQuestion(difficultyMap, nextRetryQueue);

      const newState = submitAnswer(battle, givenAnswer, nextQuestion);
      setBattle(newState);

      // Generate new choices for the next question (stay in fight mode)
      setChoices(generateChoices(nextQuestion.factorA, nextQuestion.factorB));
      setAnswerStart(Date.now());

      return newState;
    },
    [battle, answerStart, difficultyMap],
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
    [battle, wildPokemon],
  );

  const handleSwitch = useCallback(() => {
    const newState = applyFreeDamage(battle);
    setBattle(newState);
    return newState;
  }, [battle]);

  const handleRun = useCallback(() => {
    setBattle((s) => ({ ...s, status: "lost", xpGained: 0, mode: "menu" }));
  }, []);

  return {
    battle,
    choices,
    enterFight,
    enterCatch,
    setMode,
    handleAnswer,
    handleCatch,
    handleSwitch,
    handleRun,
  };
}
