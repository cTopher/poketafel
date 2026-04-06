import type {
  BattleState,
  OwnedPokemon,
  WildPokemon,
  Question,
  TurnResult,
} from "@shared/types";
import {
  FLAT_DAMAGE,
  PLAYER_BASE_HP,
  HP_PER_LEVEL,
  DAMAGE_PER_LEVEL,
  WILD_HP_BASE,
  WILD_HP_PER_PLAYER_LEVEL,
  CATCH_HP_THRESHOLD,
  XP_PER_CORRECT,
  XP_PER_WIN,
} from "@shared/types";

export function getPlayerStats(level: number) {
  return {
    maxHp: PLAYER_BASE_HP + HP_PER_LEVEL * (level - 1),
    damage: FLAT_DAMAGE + DAMAGE_PER_LEVEL * (level - 1),
  };
}

function getWildMaxHp(playerLevel: number): number {
  return WILD_HP_BASE + WILD_HP_PER_PLAYER_LEVEL * (playerLevel - 1);
}

export function createBattle(
  playerPokemon: OwnedPokemon,
  wildPokemon: WildPokemon,
  firstQuestion: Question,
): BattleState {
  const stats = getPlayerStats(playerPokemon.level);
  const wildMaxHp = getWildMaxHp(playerPokemon.level);

  return {
    wildPokemon,
    playerPokemon,
    wildHp: wildMaxHp,
    wildMaxHp,
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    currentQuestion: firstQuestion,
    retryQueue: [],
    turnResult: null,
    canCatch: false,
    catchMode: false,
    mode: "menu",
    status: "active",
    xpGained: 0,
  };
}

export function submitAnswer(
  state: BattleState,
  givenAnswer: number,
  nextQuestion: Question,
): BattleState {
  const { currentQuestion, playerPokemon } = state;
  const correctAnswer = currentQuestion.factorA * currentQuestion.factorB;
  const correct = givenAnswer === correctAnswer;
  const stats = getPlayerStats(playerPokemon.level);

  const turnResult: TurnResult = {
    correct,
    correctAnswer,
    givenAnswer,
    question: currentQuestion,
  };

  let { wildHp, playerHp, retryQueue, xpGained, status } = state;

  if (correct) {
    wildHp = Math.max(0, wildHp - stats.damage);
    xpGained += XP_PER_CORRECT;

    // Remove from retry queue if it was a retry
    retryQueue = retryQueue.filter(
      (q) =>
        !(
          q.factorA === currentQuestion.factorA &&
          q.factorB === currentQuestion.factorB
        ),
    );
  } else {
    playerHp = Math.max(0, playerHp - FLAT_DAMAGE);
    // Add to retry queue (if not already there)
    const alreadyQueued = retryQueue.some(
      (q) =>
        q.factorA === currentQuestion.factorA &&
        q.factorB === currentQuestion.factorB,
    );
    if (!alreadyQueued) {
      retryQueue = [...retryQueue, currentQuestion];
    }
  }

  // Check end conditions
  if (wildHp <= 0) {
    status = "won";
    xpGained += XP_PER_WIN;
  } else if (playerHp <= 0) {
    status = "lost";
    xpGained = 0; // No XP on defeat
  }

  const canCatch = canThrowPokeball(wildHp, state.wildMaxHp);

  return {
    ...state,
    wildHp,
    playerHp,
    retryQueue,
    xpGained,
    status,
    turnResult,
    canCatch,
    catchMode: false,
    currentQuestion: nextQuestion,
  };
}

export function canThrowPokeball(wildHp: number, wildMaxHp: number): boolean {
  return wildHp > 0 && wildHp / wildMaxHp <= CATCH_HP_THRESHOLD;
}

export function attemptCatch(
  state: BattleState,
  givenAnswer: number,
): BattleState {
  const { currentQuestion } = state;
  const correctAnswer = currentQuestion.factorA * currentQuestion.factorB;
  const correct = givenAnswer === correctAnswer;

  if (correct) {
    return {
      ...state,
      status: "caught",
      xpGained: state.xpGained + XP_PER_WIN,
      turnResult: {
        correct: true,
        correctAnswer,
        givenAnswer,
        question: currentQuestion,
      },
      catchMode: false,
      mode: "menu",
    };
  }

  // Catch failed — enemy free attack, return to menu
  const newPlayerHp = Math.max(0, state.playerHp - FLAT_DAMAGE);
  const newStatus = newPlayerHp <= 0 ? ("lost" as const) : state.status;

  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    catchMode: false,
    mode: "menu",
    turnResult: {
      correct: false,
      correctAnswer,
      givenAnswer,
      question: currentQuestion,
    },
  };
}

export function applyFreeDamage(state: BattleState): BattleState {
  const newPlayerHp = Math.max(0, state.playerHp - FLAT_DAMAGE);
  const newStatus = newPlayerHp <= 0 ? ("lost" as const) : state.status;
  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    mode: "menu",
  };
}
