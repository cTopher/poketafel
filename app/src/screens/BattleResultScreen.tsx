import { useEffect } from "react";
import type { BattleResult } from "@shared/types";
import { useSound } from "../hooks/useSound";
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
    won: "#68a848",
    caught: "#f8d030",
    lost: "#e84040",
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
        background: "linear-gradient(180deg, #286830 0%, #185028 40%, #103820 100%)",
        padding: 40,
      }}
    >
      <h2
        style={{
          fontSize: "1.5em",
          color: outcomeColors[result.outcome],
          textShadow: "2px 2px 0 #103010",
        }}
      >
        {outcomeText[result.outcome]}
      </h2>

      {result.outcome === "caught" && caughtPokemonInfo ? (
        <PokemonSprite src={caughtPokemonInfo.spriteFront} alt={caughtPokemonInfo.name} size={96} />
      ) : (
        <PokemonSprite src={playerPokemonInfo.spriteFront} alt={playerPokemonInfo.name} size={96} />
      )}

      <div className="emerald-textbox" style={{ maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
          {result.outcome !== "lost" && (
            <p>
              {playerPokemonInfo.name} gained {result.xpGained} XP!
            </p>
          )}

          {result.leveledUp && (
            <p style={{ color: "#4888c8" }}>
              {playerPokemonInfo.name} grew to Lv.{result.newLevel}!
            </p>
          )}

          {result.evolved && result.evolvedTo && (
            <p style={{ color: "#a848a8" }}>
              {playerPokemonInfo.name} is evolving...!
            </p>
          )}

          {result.outcome === "caught" && (
            <p style={{ color: "#68a848" }}>
              {caughtPokemonInfo?.name ?? "Pokémon"} was caught!
            </p>
          )}

          {result.outcome === "lost" && (
            <p>
              Better luck next time! Keep practicing!
            </p>
          )}
        </div>
      </div>

      <button className="gba-button" onClick={onContinue} style={{ fontSize: "0.7em" }}>
        CONTINUE
      </button>
    </div>
  );
}
