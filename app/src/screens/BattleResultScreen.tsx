import { useEffect } from "react";
import type { BattleResult } from "@shared/types";
import { useSound } from "../hooks/useSound";
import { PokemonSprite } from "../components/PokemonSprite";
import type { PokemonBasicInfo } from "../lib/pokeapi";
import styles from "./BattleResultScreen.module.css";

interface BattleResultScreenProps {
  result: BattleResult;
  playerPokemonInfo: PokemonBasicInfo;
  caughtPokemonInfo?: PokemonBasicInfo;
  onContinue: () => void;
}

const outcomeColorMap: Record<string, string | undefined> = {
  won: styles.outcomeWon,
  caught: styles.outcomeCaught,
  lost: styles.outcomeLost,
};

const outcomeText: Record<string, string> = {
  won: "VICTORY!",
  caught: "GOT IT!",
  lost: "DEFEATED...",
};

export function BattleResultScreen({ result, playerPokemonInfo, caughtPokemonInfo, onContinue }: BattleResultScreenProps) {
  const { playSfx } = useSound();

  useEffect(() => {
    if (result.outcome === "won" || result.outcome === "caught") {
      playSfx("levelup");
    }
  }, [result.outcome, playSfx]);

  return (
    <div className={styles.container}>
      <h2 className={`${styles.outcomeTitle} ${outcomeColorMap[result.outcome]}`}>
        {outcomeText[result.outcome]}
      </h2>

      {result.outcome === "caught" && caughtPokemonInfo ? (
        <PokemonSprite src={caughtPokemonInfo.spriteFront} alt={caughtPokemonInfo.name} size={96} />
      ) : (
        <PokemonSprite src={playerPokemonInfo.spriteFront} alt={playerPokemonInfo.name} size={96} />
      )}

      <div className={`emerald-textbox ${styles.resultBox}`}>
        <div className={styles.resultContent}>
          {result.outcome !== "lost" && (
            <p>
              {playerPokemonInfo.name} gained {result.xpGained} XP!
            </p>
          )}

          {result.leveledUp && (
            <p className={styles.levelUp}>
              {playerPokemonInfo.name} grew to Lv.{result.newLevel}!
            </p>
          )}

          {result.evolved && result.evolvedTo && (
            <p className={styles.evolving}>
              {playerPokemonInfo.name} is evolving...!
            </p>
          )}

          {result.outcome === "caught" && (
            <p className={styles.caught}>
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

      <button className={`gba-button ${styles.continueButton}`} onClick={onContinue}>
        CONTINUE
      </button>
    </div>
  );
}
