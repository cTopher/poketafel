import { useState, useEffect } from "react";
import { getPokemon, STARTER_IDS, type PokemonBasicInfo } from "../lib/pokeapi";
import styles from "./StarterSelectScreen.module.css";

interface StarterSelectScreenProps {
  onSelect: (pokeapiId: number) => Promise<void>;
}

const typeColors: Record<string, string> = {
  grass: "#68a848",
  fire: "#e84040",
  water: "#4888c8",
  poison: "#a848a8",
  normal: "#a0a0a0",
};

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
      <div className={styles.loadingStarters}>
        LOADING POKéMON...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={`emerald-textbox ${styles.promptBox}`}>
        <p className={styles.promptText}>Choose your partner POKéMON!</p>
      </div>

      <div className={styles.starterGrid}>
        {starters.map((starter) => (
          <button
            key={starter.id}
            onClick={() => setSelected(starter.id)}
            className={`${styles.starterCard} ${selected === starter.id ? styles.starterCardSelected : ""}`}
          >
            <img
              src={starter.spriteFront}
              alt={starter.name}
              className={styles.starterSprite}
            />
            <span className={styles.starterName}>
              {starter.name}
            </span>
            <span
              className={styles.starterType}
              style={{ color: (starter.types[0] ? typeColors[starter.types[0]] : undefined) ?? "#a0a0a0" }}
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
