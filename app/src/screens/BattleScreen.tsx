import { useState, useEffect } from "react";
import type { OwnedPokemon, DifficultyRow, BattleResult } from "@shared/types";
import { xpToNextLevel } from "@shared/types";
import { useBattle } from "../hooks/useBattle";
import { useSound } from "../hooks/useSound";
import { getPokemon, randomWildPokemonId, type PokemonBasicInfo } from "../lib/pokeapi";
import { NamePlate } from "../components/NamePlate";
import { PokemonSprite } from "../components/PokemonSprite";
import { QuestionInput } from "../components/QuestionInput";
import type { WildPokemon } from "@shared/types";
import styles from "./BattleScreen.module.css";

interface BattleScreenProps {
  playerPokemon: OwnedPokemon;
  playerPokemonInfo: PokemonBasicInfo;
  difficultyRows: DifficultyRow[];
  onEnd: (result: BattleResult) => void;
}

export function BattleScreen({ playerPokemon, playerPokemonInfo, difficultyRows, onEnd }: BattleScreenProps) {
  const [wildInfo, setWildInfo] = useState<PokemonBasicInfo | null>(null);
  const [wildPokemon, setWildPokemon] = useState<WildPokemon | null>(null);
  const { playCry } = useSound();

  useEffect(() => {
    const wildId = randomWildPokemonId();
    getPokemon(wildId).then((info) => {
      setWildInfo(info);
      setWildPokemon({
        pokeapiId: info.id,
        name: info.name,
        spriteUrl: info.spriteFront,
        cryUrl: info.cryUrl,
        types: info.types,
      });
      playCry(info.cryUrl);
    });
  }, [playCry]);

  if (!wildPokemon || !wildInfo) {
    return (
      <div className={styles.loadingBattle}>
        A wild POKéMON appears...
      </div>
    );
  }

  return (
    <BattleActive
      playerPokemon={playerPokemon}
      playerPokemonInfo={playerPokemonInfo}
      wildPokemon={wildPokemon}
      wildInfo={wildInfo}
      difficultyRows={difficultyRows}
      onEnd={onEnd}
    />
  );
}

function BattleActive({
  playerPokemon,
  playerPokemonInfo,
  wildPokemon,
  wildInfo,
  difficultyRows,
  onEnd,
}: BattleScreenProps & { wildPokemon: WildPokemon; wildInfo: PokemonBasicInfo }) {
  const { battle, handleAnswer, handleCatch, enterCatchMode } = useBattle({
    playerPokemon,
    wildPokemon,
    difficultyRows,
    onBattleEnd: () => {},
  });
  const { playSfx, playCry } = useSound();
  const [spriteAnims, setSpriteAnims] = useState({ wild: "idle", player: "idle" });

  async function onAnswer(givenAnswer: number) {
    if (battle.catchMode) {
      const result = await handleCatch(givenAnswer);
      if (result.status === "caught") {
        playSfx("catch");
        playCry(wildPokemon.cryUrl);
      } else {
        playSfx("wrong");
        playSfx("pokeball");
      }
      if (result.status !== "active") {
        finishBattle(result.status);
      }
      return;
    }

    const result = await handleAnswer(givenAnswer);

    if (result.turnResult?.correct) {
      playSfx("hit");
      setSpriteAnims({ wild: "damage", player: "attack" });
    } else {
      playSfx("wrong");
      playSfx("damage");
      setSpriteAnims({ wild: "idle", player: "damage" });
    }

    setTimeout(() => setSpriteAnims({ wild: "idle", player: "idle" }), 400);

    if (result.status !== "active") {
      const outcome = result.status as "won" | "lost" | "caught";
      setTimeout(() => finishBattle(outcome), 800);
    }
  }

  function finishBattle(outcome: "won" | "lost" | "caught") {
    const xpGained = battle.xpGained;
    const currentXp = playerPokemon.xp + xpGained;
    const needed = xpToNextLevel(playerPokemon.level);
    const leveledUp = currentXp >= needed;
    const newLevel = leveledUp ? playerPokemon.level + 1 : playerPokemon.level;

    onEnd({
      outcome,
      xpGained,
      leveledUp,
      newLevel,
      evolved: false,
      evolvedTo: null,
      caughtPokemon: outcome === "caught" ? wildPokemon : null,
    });
  }

  return (
    <div className={styles.wrapper}>
      {/* Battle arena */}
      <div className={styles.battleBg}>
        {/* Grass platforms */}
        <div className={styles.enemyPlatform} />
        <div className={styles.playerPlatform} />

        {/* Enemy name plate — top LEFT */}
        <div className={styles.enemyPlatePos}>
          <NamePlate
            name={wildPokemon.name}
            level={0}
            currentHp={battle.wildHp}
            maxHp={battle.wildMaxHp}
            side="enemy"
          />
        </div>

        {/* Wild Pokemon sprite — top RIGHT, on platform */}
        <div className={styles.wildSpritePos}>
          <PokemonSprite
            src={wildInfo.spriteFront}
            alt={wildPokemon.name}
            size={110}
            animation={spriteAnims.wild as any}
          />
        </div>

        {/* Player name plate — bottom RIGHT */}
        <div className={styles.playerPlatePos}>
          <NamePlate
            name={playerPokemonInfo.name}
            level={playerPokemon.level}
            currentHp={battle.playerHp}
            maxHp={battle.playerMaxHp}
            side="player"
          />
        </div>

        {/* Player Pokemon sprite — bottom LEFT, on platform */}
        <div className={styles.playerSpritePos}>
          <PokemonSprite
            src={playerPokemonInfo.spriteBack}
            alt={playerPokemon.nickname ?? playerPokemonInfo.name}
            size={120}
            animation={spriteAnims.player as any}
          />
        </div>

        {/* Pokeball button overlay when catch available */}
        {battle.canCatch && !battle.catchMode && battle.status === "active" && (
          <button
            className={`gba-button ${styles.pokeballButton}`}
            onClick={() => {
              playSfx("pokeball");
              enterCatchMode();
            }}
          >
            POKéBALL!
          </button>
        )}
      </div>

      {/* Bottom text box panel — Emerald style */}
      <div className={styles.bottomPanel}>
        {/* Wrong answer feedback */}
        {battle.turnResult && !battle.turnResult.correct && (
          <div className={styles.wrongAnswer}>
            {battle.turnResult.question.factorA} x {battle.turnResult.question.factorB} = {battle.turnResult.correctAnswer}
          </div>
        )}

        {battle.status === "active" && !battle.catchMode && (
          <div className={styles.questionArea}>
            <QuestionInput
              question={battle.currentQuestion}
              onSubmit={onAnswer}
              disabled={battle.status !== "active"}
            />
          </div>
        )}

        {battle.catchMode && (
          <div className={styles.catchArea}>
            <p className={styles.catchPrompt}>
              Catch question! Get it right!
            </p>
            <QuestionInput question={battle.currentQuestion} onSubmit={onAnswer} />
          </div>
        )}
      </div>
    </div>
  );
}
