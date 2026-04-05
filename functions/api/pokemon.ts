import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type { CatchRequest, OwnedPokemon } from "../../shared/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const sql = getDb(context.env);

  const collection = await sql`
    SELECT id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
    FROM pokemon_collection
    WHERE trainer_id = ${trainerId}
    ORDER BY caught_at ASC
  `;

  return json(collection);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const body = (await context.request.json()) as CatchRequest;
  const sql = getDb(context.env);

  const result = await sql`
    INSERT INTO pokemon_collection (trainer_id, pokeapi_id, nickname)
    VALUES (${trainerId}, ${body.pokeapi_id}, ${body.nickname ?? null})
    RETURNING id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
  `;

  return json(result[0]);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const body = (await context.request.json()) as {
    pokemon_id: number;
    set_active?: boolean;
    xp?: number;
    level?: number;
  };
  const sql = getDb(context.env);

  if (body.set_active) {
    await sql`UPDATE pokemon_collection SET is_active = FALSE WHERE trainer_id = ${trainerId}`;
    await sql`UPDATE pokemon_collection SET is_active = TRUE WHERE id = ${body.pokemon_id} AND trainer_id = ${trainerId}`;
  }

  if (body.xp !== undefined || body.level !== undefined) {
    await sql`
      UPDATE pokemon_collection
      SET
        xp = COALESCE(${body.xp ?? null}, xp),
        level = COALESCE(${body.level ?? null}, level)
      WHERE id = ${body.pokemon_id} AND trainer_id = ${trainerId}
    `;
  }

  const updated = await sql`
    SELECT id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
    FROM pokemon_collection
    WHERE id = ${body.pokemon_id} AND trainer_id = ${trainerId}
  `;

  return json(updated[0]);
};
