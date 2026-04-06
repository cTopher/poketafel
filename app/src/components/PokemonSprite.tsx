import { useState } from "react";
import styles from "./PokemonSprite.module.css";

interface PokemonSpriteProps {
  src: string;
  alt: string;
  /** Size in em units (scales with container font-size) */
  size?: number;
  animation?: "idle" | "attack" | "damage" | "faint" | "entrance" | "none";
}

const animationClassMap: Record<string, string | undefined> = {
  attack: styles.attack,
  damage: styles.damage,
  faint: styles.faint,
  entrance: styles.entrance,
};

export function PokemonSprite({
  src,
  alt,
  size = 8,
  animation = "idle",
}: PokemonSpriteProps) {
  const [shaking] = useState(false);

  const animClass = shaking
    ? styles.shake
    : (animationClassMap[animation] ?? "");

  return (
    <img
      src={src}
      alt={alt}
      className={`${styles.sprite} ${animClass}`}
      style={{ width: `${size}em`, height: `${size}em` }}
    />
  );
}
