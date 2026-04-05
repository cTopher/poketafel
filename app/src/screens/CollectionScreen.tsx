import { useState, useEffect } from "react";
import type { OwnedPokemon } from "@shared/types";
import { getPokemon, type PokemonBasicInfo } from "../lib/pokeapi";
import { PokemonSprite } from "../components/PokemonSprite";
import { api } from "../lib/api-client";

interface CollectionScreenProps {
  collection: OwnedPokemon[];
  onBack: () => void;
  onCollectionUpdate: (collection: OwnedPokemon[]) => void;
}

export function CollectionScreen({ collection, onBack, onCollectionUpdate }: CollectionScreenProps) {
  const [pokemonInfos, setPokemonInfos] = useState<Map<number, PokemonBasicInfo>>(new Map());
  const [selected, setSelected] = useState<OwnedPokemon | null>(null);

  useEffect(() => {
    Promise.all(collection.map((p) => getPokemon(p.pokeapi_id))).then((infos) => {
      const map = new Map<number, PokemonBasicInfo>();
      for (const info of infos) {
        map.set(info.id, info);
      }
      setPokemonInfos(map);
    });
  }, [collection]);

  async function handleSetActive(pokemon: OwnedPokemon) {
    await api.updatePokemon({ pokemon_id: pokemon.id, set_active: true });
    const updated = await api.getCollection();
    onCollectionUpdate(updated);
    setSelected(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, var(--gba-dark) 0%, var(--gba-bg) 100%)",
        padding: 24,
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "0.8em", color: "var(--gba-gold)" }}>MY POKéMON</h2>
        <button className="gba-button" onClick={onBack} style={{ fontSize: "0.5em" }}>
          BACK
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 12,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {collection.map((pokemon) => {
          const info = pokemonInfos.get(pokemon.pokeapi_id);
          return (
            <button
              key={pokemon.id}
              onClick={() => setSelected(pokemon)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: 8,
                background: pokemon.is_active
                  ? "rgba(255,205,117,0.2)"
                  : selected?.id === pokemon.id
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.03)",
                border: pokemon.is_active
                  ? "2px solid var(--gba-gold)"
                  : "2px solid var(--gba-border)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {info && (
                <PokemonSprite src={info.spriteFront} alt={info.name} size={64} animation="none" />
              )}
              <span style={{ fontSize: "0.35em", textTransform: "uppercase" }}>
                {info?.name ?? "???"}
              </span>
              <span style={{ fontSize: "0.3em", color: "var(--gba-cyan)" }}>Lv.{pokemon.level}</span>
              {pokemon.is_active && (
                <span style={{ fontSize: "0.25em", color: "var(--gba-gold)" }}>ACTIVE</span>
              )}
            </button>
          );
        })}
      </div>

      {selected && !selected.is_active && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            className="gba-button"
            onClick={() => handleSetActive(selected)}
            style={{ fontSize: "0.55em" }}
          >
            SET AS ACTIVE
          </button>
        </div>
      )}
    </div>
  );
}
