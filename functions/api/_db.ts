import { neon } from "@neondatabase/serverless";

export function getDb(env: { DATABASE_URL: string }) {
  return neon(env.DATABASE_URL);
}

export interface Env {
  DATABASE_URL: string;
}
