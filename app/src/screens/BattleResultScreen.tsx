import { useEffect } from "react";
import type { BattleResult } from "@shared/types";
import { useSound } from "../hooks/useSound";
import { TextBox } from "../components/TextBox";
import { PokemonSprite } from "../components/PokemonSprite";
import type { PokemonBasicInfo } from "../lib/pokeapi";

interface BattleResultScreenProps {
  result: BattleResult;
  playerPokemonInfo: PokemonBasicInfo;
  caughtPokemonInfo?: PokemonBasicInfo;
  onContinue: () => void;
}

export function BattleResultScreen({ result, playerPokemonInfo, caughtPokemonInfo, onContinue }: BattleResultScreenProps) {
  const { playSfx } = useSound();

  useEffect(() => {
    if (result.outcome === "won" || result.outcome === "caught") {
      playSfx("levelup");
    }
  }, [result.outcome, playSfx]);

  const outcomeColors: Record<string, string> = {
    won: "var(--gba-green)",
    caught: "var(--gba-gold)",
    lost: "var(--gba-red)",
  };

  const outcomeText: Record<string, string> = {
    won: "VICTORY!",
    caught: "GOT IT!",
    lost: "DEFEATED...",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 20,
        background: "linear-gradient(180deg, var(--gba-dark) 0%, var(--gba-bg) 100%)",
        padding: 40,
      }}
    >
      <h2
        style={{
          fontSize: "1.5em",
          color: outcomeColors[result.outcome],
          textShadow: "2px 2px 0 var(--gba-dark)",
        }}
      >
        {outcomeText[result.outcome]}
      </h2>

      {result.outcome === "caught" && caughtPokemonInfo ? (
        <PokemonSprite src={caughtPokemonInfo.spriteFront} alt={caughtPokemonInfo.name} size={96} />
      ) : (
        <PokemonSprite src={playerPokemonInfo.spriteFront} alt={playerPokemonInfo.name} size={96} />
      )}

      <TextBox>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
          {result.outcome !== "lost" && (
            <p style={{ color: "var(--gba-dark)" }}>
              {playerPokemonInfo.name} gained {result.xpGained} XP!
            </p>
          )}

          {result.leveledUp && (
            <p style={{ color: "#3b5dc9" }}>
              {playerPokemonInfo.name} grew to Lv.{result.newLevel}!
            </p>
          )}

          {result.evolved && result.evolvedTo && (
            <p style={{ color: "#b55088" }}>
              {playerPokemonInfo.name} is evolving...!
            </p>
          )}

          {result.outcome === "caught" && (
            <p style={{ color: "#38b764" }}>
              {caughtPokemonInfo?.name ?? "Pokémon"} was caught!
            </p>
          )}

          {result.outcome === "lost" && (
            <p style={{ color: "var(--gba-dark)" }}>
              Better luck next time! Keep practicing!
            </p>
          )}
        </div>
      </TextBox>

      <button className="gba-button" onClick={onContinue} style={{ fontSize: "0.7em" }}>
        CONTINUE
      </button>
    </div>
  );
}
