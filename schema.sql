-- Pokétafel database schema for Neon Postgres

CREATE TABLE trainers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  favorite_num INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, favorite_num)
);

CREATE TABLE pokemon_collection (
  id SERIAL PRIMARY KEY,
  trainer_id INT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  pokeapi_id INT NOT NULL,
  nickname TEXT,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  caught_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pokemon_collection_trainer ON pokemon_collection(trainer_id);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  trainer_id INT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  factor_a INT NOT NULL,
  factor_b INT NOT NULL,
  given_answer INT NOT NULL,
  correct BOOLEAN NOT NULL,
  time_ms INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_answers_trainer ON answers(trainer_id);

CREATE TABLE difficulty (
  id SERIAL PRIMARY KEY,
  trainer_id INT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  factor_a INT NOT NULL,
  factor_b INT NOT NULL,
  score FLOAT NOT NULL DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainer_id, factor_a, factor_b)
);

CREATE INDEX idx_difficulty_trainer ON difficulty(trainer_id);
