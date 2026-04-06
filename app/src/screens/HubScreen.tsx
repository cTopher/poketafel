import type { Trainer, OwnedPokemon } from "@shared/types";
import { useState, useEffect } from "react";
import { getPokemon, type PokemonBasicInfo } from "../lib/pokeapi";
import { PokemonSprite } from "../components/PokemonSprite";
import type { Screen } from "@shared/types";
import styles from "./HubScreen.module.css";

interface HubScreenProps {
  trainer: Trainer;
  activePokemon: OwnedPokemon;
  collectionCount: number;
  onNavigate: (screen: Screen) => void;
}

export function HubScreen({
  trainer,
  activePokemon,
  collectionCount,
  onNavigate,
}: HubScreenProps) {
  const [pokemonInfo, setPokemonInfo] = useState<PokemonBasicInfo | null>(null);

  useEffect(() => {
    void getPokemon(activePokemon.pokeapi_id).then(setPokemonInfo);
  }, [activePokemon.pokeapi_id]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>POKéTAFEL</h1>

      <p className={styles.trainerName}>Trainer {trainer.name}</p>

      {pokemonInfo && (
        <div className={styles.pokemonPreview}>
          <PokemonSprite
            src={pokemonInfo.spriteFront}
            alt={pokemonInfo.name}
            size={96}
          />
          <span className={styles.pokemonLabel}>
            {pokemonInfo.name} Lv.{activePokemon.level}
          </span>
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button
          className={`gba-button ${styles.battleButton}`}
          onClick={() => {
            onNavigate("battle");
          }}
        >
          BATTLE!
        </button>

        <button
          className={`gba-button ${styles.collectionButton}`}
          onClick={() => {
            onNavigate("collection");
          }}
        >
          MY POKéMON ({collectionCount})
        </button>
      </div>
    </div>
  );
}
