import { getDb, type Env } from "./_db";
import type { LoginRequest, LoginResponse, Trainer } from "../../shared/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { name, favorite_num } = (await context.request.json()) as LoginRequest;

  if (
    !name ||
    typeof favorite_num !== "number" ||
    favorite_num < 1 ||
    favorite_num > 999
  ) {
    return new Response(JSON.stringify({ error: "Invalid name or number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sql = getDb(context.env);

  const normalizedName = name.trim().toLowerCase();

  const existing = await sql`
    SELECT id, name, favorite_num, created_at
    FROM trainers
    WHERE LOWER(name) = ${normalizedName} AND favorite_num = ${favorite_num}
  `;

  let trainer: Trainer;

  if (existing.length > 0) {
    trainer = existing[0] as unknown as Trainer;
  } else {
    const created = await sql`
      INSERT INTO trainers (name, favorite_num)
      VALUES (${normalizedName}, ${favorite_num})
      RETURNING id, name, favorite_num, created_at
    `;
    trainer = created[0] as unknown as Trainer;
  }

  const token = btoa(`${trainer.id}:${trainer.name}:${trainer.favorite_num}`);
  const response: LoginResponse = { trainer, token };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
};
