import type {
  BattleState,
  OwnedPokemon,
  WildPokemon,
  Question,
  TurnResult,
} from "@shared/types";
import {
  PLAYER_BASE_HP,
  HP_PER_LEVEL,
  DAMAGE_BASE,
  DAMAGE_PER_LEVEL,
  CATCH_HP_THRESHOLD,
  XP_PER_CORRECT,
  XP_WIN_PER_LEVEL,
} from "@shared/types";

export function getPlayerStats(level: number) {
  return {
    maxHp: PLAYER_BASE_HP + HP_PER_LEVEL * (level - 1),
    damage: DAMAGE_BASE + DAMAGE_PER_LEVEL * (level - 1),
  };
}

export function getWildStats(level: number) {
  return {
    maxHp: PLAYER_BASE_HP + HP_PER_LEVEL * (level - 1),
    damage: DAMAGE_BASE + DAMAGE_PER_LEVEL * (level - 1),
  };
}

export function pickWildLevel(playerLevel: number): number {
  const offset = Math.floor(Math.random() * 5) - 2; // -2..2 inclusive
  return Math.max(1, playerLevel + offset);
}

export function createBattle(
  playerPokemon: OwnedPokemon,
  wildPokemon: WildPokemon,
  firstQuestion: Question,
): BattleState {
  const playerStats = getPlayerStats(playerPokemon.level);
  const wildStats = getWildStats(wildPokemon.level);

  return {
    wildPokemon,
    playerPokemon,
    wildHp: wildStats.maxHp,
    wildMaxHp: wildStats.maxHp,
    playerHp: playerStats.maxHp,
    playerMaxHp: playerStats.maxHp,
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
  const playerStats = getPlayerStats(playerPokemon.level);

  const turnResult: TurnResult = {
    correct,
    correctAnswer,
    givenAnswer,
    question: currentQuestion,
  };

  let { wildHp, playerHp, retryQueue, xpGained, status } = state;

  if (correct) {
    wildHp = Math.max(0, wildHp - playerStats.damage);
    xpGained += XP_PER_CORRECT;

    retryQueue = retryQueue.filter(
      (q) =>
        !(
          q.factorA === currentQuestion.factorA &&
          q.factorB === currentQuestion.factorB
        ),
    );
  } else {
    const wildStats = getWildStats(state.wildPokemon.level);
    playerHp = Math.max(0, playerHp - wildStats.damage);
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
  const wildStats = getWildStats(state.wildPokemon.level);
  const newPlayerHp = Math.max(0, state.playerHp - wildStats.damage);
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
  const wildStats = getWildStats(state.wildPokemon.level);
  const newPlayerHp = Math.max(0, state.playerHp - wildStats.damage);
  const newStatus = newPlayerHp <= 0 ? ("lost" as const) : state.status;
  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    mode: "menu",
  };
}
