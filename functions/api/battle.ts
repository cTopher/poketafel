import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type { SubmitAnswerRequest, SubmitAnswerResponse } from "../../shared/types";
import {
  DIFFICULTY_DEFAULT,
  DIFFICULTY_MIN,
  DIFFICULTY_WRONG_DELTA,
  DIFFICULTY_SLOW_DELTA,
  DIFFICULTY_MODERATE_DELTA,
  DIFFICULTY_FAST_DELTA,
  SLOW_THRESHOLD_MS,
  FAST_THRESHOLD_MS,
} from "../../shared/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const body = (await context.request.json()) as SubmitAnswerRequest;
  const { factor_a, factor_b, given_answer, time_ms } = body;
  const correctAnswer = factor_a * factor_b;
  const correct = given_answer === correctAnswer;

  const sql = getDb(context.env);

  await sql`
    INSERT INTO answers (trainer_id, factor_a, factor_b, given_answer, correct, time_ms)
    VALUES (${trainerId}, ${factor_a}, ${factor_b}, ${given_answer}, ${correct}, ${time_ms})
  `;

  let delta: number;
  if (!correct) {
    delta = DIFFICULTY_WRONG_DELTA;
  } else if (time_ms > SLOW_THRESHOLD_MS) {
    delta = DIFFICULTY_SLOW_DELTA;
  } else if (time_ms > FAST_THRESHOLD_MS) {
    delta = DIFFICULTY_MODERATE_DELTA;
  } else {
    delta = DIFFICULTY_FAST_DELTA;
  }

  const result = await sql`
    INSERT INTO difficulty (trainer_id, factor_a, factor_b, score, updated_at)
    VALUES (${trainerId}, ${factor_a}, ${factor_b}, ${Math.max(DIFFICULTY_MIN, DIFFICULTY_DEFAULT + delta)}, NOW())
    ON CONFLICT (trainer_id, factor_a, factor_b)
    DO UPDATE SET
      score = GREATEST(${DIFFICULTY_MIN}, difficulty.score + ${delta}),
      updated_at = NOW()
    RETURNING score
  `;

  const newScore = result[0]?.score ?? DIFFICULTY_DEFAULT;

  const response: SubmitAnswerResponse = {
    correct,
    correct_answer: correctAnswer,
    new_score: newScore as number,
  };

  return json(response);
};
