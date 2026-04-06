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
        background: "linear-gradient(180deg, #286830 0%, #185028 40%, #103820 100%)",
        padding: 32,
      }}
    >
      <h1
        style={{
          fontSize: "1.4em",
          color: "#f8d030",
          textShadow: "3px 3px 0 #504000",
        }}
      >
        POKéTAFEL
      </h1>

      <p style={{ fontSize: "0.5em", color: "#a0d8a0" }}>
        Trainer {trainer.name}
      </p>

      {pokemonInfo && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <PokemonSprite src={pokemonInfo.spriteFront} alt={pokemonInfo.name} size={96} />
          <span style={{ fontSize: "0.5em", textTransform: "uppercase", color: "#f0f0e8" }}>
            {pokemonInfo.name} Lv.{activePokemon.level}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
        <button
          className="gba-button"
          onClick={() => onNavigate("battle")}
          style={{
            width: "100%", fontSize: "0.65em", padding: "14px 20px",
            background: "#e84040", border: "3px solid #b83030",
          }}
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
