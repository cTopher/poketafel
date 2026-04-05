import { useState } from "react";

interface PokemonSpriteProps {
  src: string;
  alt: string;
  size?: number;
  animation?: "idle" | "attack" | "damage" | "faint" | "entrance" | "none";
}

const animationStyles: Record<string, React.CSSProperties> = {
  idle: {},
  attack: { transform: "translateX(20px)", filter: "brightness(2)" },
  damage: { transform: "translateX(-10px)", filter: "brightness(0.5)" },
  faint: { opacity: 0, transform: "translateY(20px)" },
  entrance: { animation: "slideIn 0.5s ease-out" },
  none: {},
};

export function PokemonSprite({ src, alt, size = 128, animation = "idle" }: PokemonSpriteProps) {
  const [shaking, setShaking] = useState(false);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    imageRendering: "pixelated",
    transition: "all 0.3s ease-out",
    ...(shaking
      ? { animation: "shake 0.3s ease-in-out" }
      : animationStyles[animation] ?? {}),
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <img src={src} alt={alt} style={style} />
    </>
  );
}
