import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type { GameState } from "../../shared/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const sql = getDb(context.env);

  const [collection, difficulty] = await Promise.all([
    sql`
      SELECT id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
      FROM pokemon_collection
      WHERE trainer_id = ${trainerId}
      ORDER BY caught_at ASC
    `,
    sql`
      SELECT id, trainer_id, factor_a, factor_b, score, updated_at
      FROM difficulty
      WHERE trainer_id = ${trainerId}
    `,
  ]);

  const state: GameState = {
    collection: collection as unknown as GameState["collection"],
    difficulty: difficulty as unknown as GameState["difficulty"],
  };

  return json(state);
};
