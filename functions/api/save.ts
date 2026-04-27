import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type { GameState, OwnedPokemon } from "../../shared/types";
import { applyXp } from "../../shared/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const sql = getDb(context.env);

  const [collectionRaw, difficulty] = await Promise.all([
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

  const collection = collectionRaw as unknown as OwnedPokemon[];

  // Migrate any over-cap XP into level-ups (cascade). Persist if any row changed.
  const migrated: OwnedPokemon[] = [];
  for (const p of collection) {
    const { newLevel, newXp, leveledUp } = applyXp(p.level, p.xp, 0);
    if (leveledUp) {
      await sql`
        UPDATE pokemon_collection
        SET level = ${newLevel}, xp = ${newXp}
        WHERE id = ${p.id} AND trainer_id = ${trainerId}
      `;
      migrated.push({ ...p, level: newLevel, xp: newXp });
    } else {
      migrated.push(p);
    }
  }

  const state: GameState = {
    collection: migrated,
    difficulty: difficulty as unknown as GameState["difficulty"],
  };

  return json(state);
};
