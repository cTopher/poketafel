import { useState, useEffect, useCallback } from "react";
import type { OwnedPokemon, DifficultyRow, BattleResult } from "@shared/types";
import { xpToNextLevel } from "@shared/types";
import { useBattle } from "../hooks/useBattle";
import { useSound } from "../hooks/useSound";
import {
  getPokemon,
  randomWildPokemonId,
  type PokemonBasicInfo,
} from "../lib/pokeapi";
import { NamePlate } from "../components/NamePlate";
import { PokemonSprite } from "../components/PokemonSprite";
import { ActionMenu } from "../components/ActionMenu";
import { BattleChoices } from "../components/BattleChoices";
import { CollectionScreen } from "./CollectionScreen";
import type { WildPokemon } from "@shared/types";
import styles from "./BattleScreen.module.css";

interface BattleScreenProps {
  playerPokemon: OwnedPokemon;
  playerPokemonInfo: PokemonBasicInfo;
  difficultyRows: DifficultyRow[];
  collection: OwnedPokemon[];
  onEnd: (result: BattleResult) => void | Promise<void>;
  onCollectionUpdate: (collection: OwnedPokemon[]) => void;
}

export function BattleScreen({
  playerPokemon,
  playerPokemonInfo,
  difficultyRows,
  collection,
  onEnd,
  onCollectionUpdate,
}: BattleScreenProps) {
  const [wildInfo, setWildInfo] = useState<PokemonBasicInfo | null>(null);
  const [wildPokemon, setWildPokemon] = useState<WildPokemon | null>(null);
  const { playCry } = useSound();

  useEffect(() => {
    const wildId = randomWildPokemonId();
    void getPokemon(wildId).then((info) => {
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
      <div className={styles.loadingBattle}>A wild POKéMON appears...</div>
    );
  }

  return (
    <BattleActive
      playerPokemon={playerPokemon}
      playerPokemonInfo={playerPokemonInfo}
      wildPokemon={wildPokemon}
      wildInfo={wildInfo}
      difficultyRows={difficultyRows}
      collection={collection}
      onEnd={onEnd}
      onCollectionUpdate={onCollectionUpdate}
    />
  );
}

function BattleActive({
  playerPokemon,
  playerPokemonInfo,
  wildPokemon,
  wildInfo,
  difficultyRows,
  collection,
  onEnd,
  onCollectionUpdate,
}: BattleScreenProps & {
  wildPokemon: WildPokemon;
  wildInfo: PokemonBasicInfo;
}) {
  const {
    battle,
    choices,
    enterFight,
    enterCatch,
    setMode,
    handleAnswer,
    handleCatch,
    handleSwitch,
    handleRun,
  } = useBattle({
    playerPokemon,
    wildPokemon,
    difficultyRows,
  });
  const { playSfx, playCry } = useSound();
  type SpriteAnimation =
    | "idle"
    | "attack"
    | "damage"
    | "faint"
    | "entrance"
    | "none";
  const [spriteAnims, setSpriteAnims] = useState<{
    wild: SpriteAnimation;
    player: SpriteAnimation;
  }>({
    wild: "idle",
    player: "idle",
  });

  const finishBattle = useCallback(
    (outcome: "won" | "lost" | "caught") => {
      const xpGained = battle.xpGained;
      const currentXp = playerPokemon.xp + xpGained;
      const needed = xpToNextLevel(playerPokemon.level);
      const leveledUp = currentXp >= needed;
      const newLevel = leveledUp
        ? playerPokemon.level + 1
        : playerPokemon.level;

      void onEnd({
        outcome,
        xpGained,
        leveledUp,
        newLevel,
        evolved: false,
        evolvedTo: null,
        caughtPokemon: outcome === "caught" ? wildPokemon : null,
      });
    },
    [battle.xpGained, onEnd, playerPokemon, wildPokemon],
  );

  // Check for battle end from run or lost-during-catch/switch
  useEffect(() => {
    if (battle.status === "lost") {
      finishBattle("lost");
    }
  }, [battle.status, finishBattle]);

  function onFightAnswer(givenAnswer: number) {
    const result = handleAnswer(givenAnswer);

    if (result.turnResult?.correct) {
      playSfx("hit");
      setSpriteAnims({ wild: "damage", player: "attack" });
    } else {
      playSfx("wrong");
      playSfx("damage");
      setSpriteAnims({ wild: "idle", player: "damage" });
    }

    setTimeout(() => {
      setSpriteAnims({ wild: "idle", player: "idle" });
    }, 400);

    if (result.status !== "active") {
      const outcome = result.status;
      setTimeout(() => {
        finishBattle(outcome);
      }, 800);
    }
  }

  async function onCatchAnswer(givenAnswer: number) {
    const result = await handleCatch(givenAnswer);
    if (result.status === "caught") {
      playSfx("catch");
      playCry(wildPokemon.cryUrl);
      finishBattle("caught");
    } else {
      playSfx("wrong");
      // Free damage applied by attemptCatch, animate it
      setSpriteAnims({ wild: "attack", player: "damage" });
      setTimeout(() => {
        setSpriteAnims({ wild: "idle", player: "idle" });
      }, 400);
      // mode already set to "menu" by attemptCatch
    }
  }

  function onRunAction() {
    handleRun();
  }

  function onSwitchPokemon(updated: OwnedPokemon[]) {
    onCollectionUpdate(updated);
    handleSwitch();
    // Animate enemy free attack
    setSpriteAnims({ wild: "attack", player: "damage" });
    setTimeout(() => {
      setSpriteAnims({ wild: "idle", player: "idle" });
    }, 400);
  }

  // Pokemon mode renders collection fullscreen
  if (battle.mode === "pokemon") {
    return (
      <CollectionScreen
        collection={collection}
        onBack={() => {
          setMode("menu");
        }}
        onCollectionUpdate={onSwitchPokemon}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Battle arena */}
      <div className={styles.battleBg}>
        <div className={styles.enemyPlatform} />
        <div className={styles.playerPlatform} />

        <div className={styles.enemyPlatePos}>
          <NamePlate
            name={wildPokemon.name}
            level={0}
            currentHp={battle.wildHp}
            maxHp={battle.wildMaxHp}
            side="enemy"
          />
        </div>

        <div className={styles.wildSpritePos}>
          <PokemonSprite
            src={wildInfo.spriteFront}
            alt={wildPokemon.name}
            size={10.625}
            animation={spriteAnims.wild}
          />
        </div>

        <div className={styles.playerPlatePos}>
          <NamePlate
            name={playerPokemonInfo.name}
            level={playerPokemon.level}
            currentHp={battle.playerHp}
            maxHp={battle.playerMaxHp}
            side="player"
            xp={playerPokemon.xp}
            xpToNext={xpToNextLevel(playerPokemon.level)}
          />
        </div>

        <div className={styles.playerSpritePos}>
          <PokemonSprite
            src={playerPokemonInfo.spriteBack}
            alt={playerPokemon.nickname ?? playerPokemonInfo.name}
            size={11.875}
            animation={spriteAnims.player}
          />
        </div>
      </div>

      {/* Bottom panel — Emerald split layout */}
      <div className={styles.bottomPanel}>
        <div className={styles.bottomLeft}>
          <div>
            {battle.mode === "menu" && battle.status === "active" && (
              <span className={styles.bottomLeftText}>
                What will {playerPokemonInfo.name} do?
              </span>
            )}
            {battle.mode === "fight" && battle.status === "active" && (
              <>
                <span className={styles.bottomLeftText}>
                  {battle.currentQuestion.factorA} x{" "}
                  {battle.currentQuestion.factorB} = ?
                </span>
                {battle.turnResult && !battle.turnResult.correct && (
                  <div className={styles.wrongAnswer}>
                    {battle.turnResult.question.factorA} x{" "}
                    {battle.turnResult.question.factorB} ={" "}
                    {battle.turnResult.correctAnswer}
                  </div>
                )}
              </>
            )}
            {battle.mode === "catch" && battle.status === "active" && (
              <>
                <span className={styles.bottomLeftText}>
                  {battle.currentQuestion.factorA} x{" "}
                  {battle.currentQuestion.factorB} = ?
                </span>
                <div className={styles.wrongAnswer}>Catch it!</div>
              </>
            )}
          </div>
        </div>

        <div className={styles.bottomRight}>
          {battle.mode === "menu" && battle.status === "active" && (
            <ActionMenu
              onFight={enterFight}
              onPokemon={() => {
                setMode("pokemon");
              }}
              onCatch={enterCatch}
              onRun={onRunAction}
              catchEnabled={battle.canCatch}
            />
          )}

          {battle.mode === "fight" && battle.status === "active" && (
            <BattleChoices
              choices={choices}
              onAnswer={onFightAnswer}
              onBack={() => {
                setMode("menu");
              }}
            />
          )}

          {battle.mode === "catch" && battle.status === "active" && (
            <BattleChoices choices={choices} onAnswer={onCatchAnswer} />
          )}
        </div>
      </div>
    </div>
  );
}
