import { useState, useEffect } from "react";
import type { OwnedPokemon } from "@shared/types";
import { getPokemon, type PokemonBasicInfo } from "../lib/pokeapi";
import { PokemonSprite } from "../components/PokemonSprite";
import { api } from "../lib/api-client";
import styles from "./CollectionScreen.module.css";

interface CollectionScreenProps {
  collection: OwnedPokemon[];
  onBack: () => void;
  onCollectionUpdate: (collection: OwnedPokemon[]) => void;
}

export function CollectionScreen({
  collection,
  onBack,
  onCollectionUpdate,
}: CollectionScreenProps) {
  const [pokemonInfos, setPokemonInfos] = useState(
    new Map<number, PokemonBasicInfo>(),
  );
  const [selected, setSelected] = useState<OwnedPokemon | null>(null);

  useEffect(() => {
    void Promise.all(collection.map((p) => getPokemon(p.pokeapi_id))).then(
      (infos) => {
        const map = new Map<number, PokemonBasicInfo>();
        for (const info of infos) {
          map.set(info.id, info);
        }
        setPokemonInfos(map);
      },
    );
  }, [collection]);

  async function handleSetActive(pokemon: OwnedPokemon) {
    await api.updatePokemon({ pokemon_id: pokemon.id, set_active: true });
    const updated = await api.getCollection();
    onCollectionUpdate(updated);
    setSelected(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>MY POKéMON</h2>
        <button className={`gba-button ${styles.backButton}`} onClick={onBack}>
          BACK
        </button>
      </div>

      <div className={styles.grid}>
        {collection.map((pokemon) => {
          const info = pokemonInfos.get(pokemon.pokeapi_id);
          const cardClass = `${styles.pokemonCard} ${
            pokemon.is_active
              ? styles.pokemonCardActive
              : selected?.id === pokemon.id
                ? styles.pokemonCardSelected
                : ""
          }`;
          return (
            <button
              key={pokemon.id}
              onClick={() => {
                setSelected(pokemon);
              }}
              className={cardClass}
            >
              {info && (
                <PokemonSprite
                  src={info.spriteFront}
                  alt={info.name}
                  size={64}
                  animation="none"
                />
              )}
              <span className={styles.pokemonName}>{info?.name ?? "???"}</span>
              <span className={styles.pokemonLevel}>Lv.{pokemon.level}</span>
              {pokemon.is_active && (
                <span className={styles.activeLabel}>ACTIVE</span>
              )}
            </button>
          );
        })}
      </div>

      {selected && !selected.is_active && (
        <div className={styles.setActiveArea}>
          <button
            className={`gba-button ${styles.setActiveButton}`}
            onClick={() => {
              void handleSetActive(selected);
            }}
          >
            SET AS ACTIVE
          </button>
        </div>
      )}
    </div>
  );
}
