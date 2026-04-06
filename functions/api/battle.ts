import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type {
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from "../../shared/types";
import { DIFFICULTY_DEFAULT } from "../../shared/types";

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

  const scoreResult = await sql`
    WITH recent AS (
      SELECT correct, time_ms
      FROM answers
      WHERE trainer_id = ${trainerId}
        AND factor_a = ${factor_a}
        AND factor_b = ${factor_b}
        AND created_at >= NOW() - INTERVAL '1 month'
      ORDER BY created_at DESC
      LIMIT 5
    ),
    scored AS (
      SELECT
        CASE
          WHEN NOT correct THEN 30
          ELSE LEAST(20, GREATEST(1, ROUND(time_ms / 1000.0)))
        END AS score
      FROM recent
    )
    SELECT ROUND(AVG(score))::int AS avg_score FROM scored
  `;

  const newScore = scoreResult[0]?.avg_score ?? DIFFICULTY_DEFAULT;

  await sql`
    INSERT INTO difficulty (trainer_id, factor_a, factor_b, score, updated_at)
    VALUES (${trainerId}, ${factor_a}, ${factor_b}, ${newScore}, NOW())
    ON CONFLICT (trainer_id, factor_a, factor_b)
    DO UPDATE SET
      score = ${newScore},
      updated_at = NOW()
  `;

  const response: SubmitAnswerResponse = {
    correct,
    correct_answer: correctAnswer,
    new_score: newScore as number,
  };

  return json(response);
};
