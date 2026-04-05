import { useState, useEffect } from "react";
import { TextBox } from "../components/TextBox";
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.7em", color: "var(--gba-gold)" }}>
        LOADING POKeMON...
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    grass: "#63c74d",
    fire: "#e83b3b",
    water: "#3b5dc9",
    poison: "#b55088",
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
        background: "linear-gradient(180deg, #2a4858 0%, #1a3040 50%, #1a1c2c 100%)",
      }}
    >
      <TextBox>
        <p style={{ textAlign: "center" }}>Choose your partner POKeMON!</p>
      </TextBox>

      <div style={{ display: "flex", gap: 32 }}>
        {starters.map((starter) => (
          <button
            key={starter.id}
            onClick={() => setSelected(starter.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 16,
              background: selected === starter.id ? "rgba(255,205,117,0.2)" : "rgba(255,255,255,0.05)",
              border: selected === starter.id ? "3px solid var(--gba-gold)" : "3px solid var(--gba-border)",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <img
              src={starter.spriteFront}
              alt={starter.name}
              style={{ width: 96, height: 96, imageRendering: "pixelated" }}
            />
            <span style={{ fontSize: "0.6em", fontFamily: "'Press Start 2P'", color: "var(--gba-white)", textTransform: "uppercase" }}>
              {starter.name}
            </span>
            <span
              style={{
                fontSize: "0.45em",
                fontFamily: "'Press Start 2P'",
                color: typeColors[starter.types[0]] ?? "var(--gba-text)",
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
          {confirming ? "CHOOSING..." : `I CHOOSE YOU!`}
        </button>
      )}
    </div>
  );
}
