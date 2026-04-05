import type { Trainer, OwnedPokemon } from "@shared/types";
import { useState, useEffect } from "react";
import { getPokemon, type PokemonBasicInfo } from "../lib/pokeapi";
import { PokemonSprite } from "../components/PokemonSprite";
import type { Screen } from "@shared/types";

interface HubScreenProps {
  trainer: Trainer;
  activePokemon: OwnedPokemon;
  collectionCount: number;
  onNavigate: (screen: Screen) => void;
}

export function HubScreen({ trainer, activePokemon, collectionCount, onNavigate }: HubScreenProps) {
  const [pokemonInfo, setPokemonInfo] = useState<PokemonBasicInfo | null>(null);

  useEffect(() => {
    getPokemon(activePokemon.pokeapi_id).then(setPokemonInfo);
  }, [activePokemon.pokeapi_id]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 20,
        background: "linear-gradient(180deg, #1a3c6e 0%, #0f2847 50%, #1a1c2c 100%)",
        padding: 32,
      }}
    >
      <h1
        style={{
          fontSize: "1.4em",
          color: "var(--gba-gold)",
          textShadow: "3px 3px 0 var(--gba-dark)",
        }}
      >
        POKéTAFEL
      </h1>

      <p style={{ fontSize: "0.55em", color: "var(--gba-cyan)" }}>
        Trainer {trainer.name}
      </p>

      {pokemonInfo && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <PokemonSprite src={pokemonInfo.spriteFront} alt={pokemonInfo.name} size={96} />
          <span style={{ fontSize: "0.5em", textTransform: "uppercase" }}>
            {pokemonInfo.name} Lv.{activePokemon.level}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
        <button
          className="gba-button"
          onClick={() => onNavigate("battle")}
          style={{ width: "100%", fontSize: "0.65em", background: "var(--gba-red)", padding: "14px 20px" }}
        >
          BATTLE!
        </button>

        <button
          className="gba-button"
          onClick={() => onNavigate("collection")}
          style={{ width: "100%", fontSize: "0.65em" }}
        >
          MY POKéMON ({collectionCount})
        </button>
      </div>
    </div>
  );
}
