import { useState, useEffect } from "react";
import { getPokemon, STARTER_IDS, type PokemonBasicInfo } from "../lib/pokeapi";

interface StarterSelectScreenProps {
  onSelect: (pokeapiId: number) => Promise<void>;
}

export function StarterSelectScreen({ onSelect }: StarterSelectScreenProps) {
  const [starters, setStarters] = useState<PokemonBasicInfo[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    Promise.all(STARTER_IDS.map(getPokemon)).then(setStarters);
  }, []);

  async function handleConfirm() {
    if (selected === null) return;
    setConfirming(true);
    await onSelect(selected);
  }

  if (starters.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", fontSize: "0.7em", color: "#f8d030",
        background: "linear-gradient(180deg, #286830 0%, #185028 40%, #103820 100%)",
      }}>
        LOADING POKéMON...
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    grass: "#68a848",
    fire: "#e84040",
    water: "#4888c8",
    poison: "#a848a8",
    normal: "#a0a0a0",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 24,
        background: "linear-gradient(180deg, #286830 0%, #185028 40%, #103820 100%)",
      }}
    >
      <div className="emerald-textbox" style={{ padding: "10px 20px" }}>
        <p style={{ textAlign: "center" }}>Choose your partner POKéMON!</p>
      </div>

      <div style={{ display: "flex", gap: 28 }}>
        {starters.map((starter) => (
          <button
            key={starter.id}
            onClick={() => setSelected(starter.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 14,
              background: selected === starter.id
                ? "rgba(248,208,48,0.2)"
                : "rgba(240,240,232,0.08)",
              border: selected === starter.id
                ? "3px solid #f8d030"
                : "3px solid #585858",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <img
              src={starter.spriteFront}
              alt={starter.name}
              style={{ width: 96, height: 96, imageRendering: "pixelated" }}
            />
            <span style={{
              fontSize: "0.55em", fontFamily: "'Press Start 2P'",
              color: "#f0f0e8", textTransform: "uppercase",
            }}>
              {starter.name}
            </span>
            <span
              style={{
                fontSize: "0.4em",
                fontFamily: "'Press Start 2P'",
                color: (starter.types[0] ? typeColors[starter.types[0]] : undefined) ?? "#a0a0a0",
                textTransform: "uppercase",
              }}
            >
              {starter.types.join(" / ")}
            </span>
          </button>
        ))}
      </div>

      {selected !== null && (
        <button className="gba-button" onClick={handleConfirm} disabled={confirming}>
          {confirming ? "CHOOSING..." : "I CHOOSE YOU!"}
        </button>
      )}
    </div>
  );
}
