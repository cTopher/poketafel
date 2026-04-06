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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", fontSize: "0.7em", color: "#383838",
        background: "linear-gradient(180deg, #88c8e8 0%, #78b8d8 40%, #68a848 40%, #58983c 100%)",
      }}>
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <style>{`
        .battle-bg {
          position: relative;
          flex: 1;
          overflow: hidden;
        }
        .battle-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg,
              #88c8e8 0%,
              #78b8d8 38%,
              #68a848 38%,
              #509038 100%
            );
        }
        .battle-bg::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          top: 38%;
          bottom: 0;
          background: repeating-linear-gradient(
            -60deg,
            transparent,
            transparent 18px,
            rgba(255,255,255,0.08) 18px,
            rgba(255,255,255,0.08) 20px
          );
        }
        .enemy-platform {
          position: absolute;
          width: 180px;
          height: 20px;
          background: radial-gradient(ellipse, #509038 0%, #68a848 50%, transparent 70%);
          border-radius: 50%;
          right: 60px;
          top: calc(38% - 10px);
        }
        .player-platform {
          position: absolute;
          width: 240px;
          height: 28px;
          background: radial-gradient(ellipse, #407830 0%, #509038 50%, transparent 70%);
          border-radius: 50%;
          left: 30px;
          bottom: 18px;
        }
      `}</style>

      {/* Battle arena */}
      <div className="battle-bg">
        {/* Grass platforms */}
        <div className="enemy-platform" />
        <div className="player-platform" />

        {/* Enemy name plate — top LEFT */}
        <div style={{ position: "absolute", top: 16, left: 0, zIndex: 2 }}>
          <NamePlate
            name={wildPokemon.name}
            level={0}
            currentHp={battle.wildHp}
            maxHp={battle.wildMaxHp}
            side="enemy"
          />
        </div>

        {/* Wild Pokemon sprite — top RIGHT, on platform */}
        <div style={{
          position: "absolute",
          right: 70,
          top: "calc(38% - 120px)",
          zIndex: 1,
        }}>
          <PokemonSprite
            src={wildInfo.spriteFront}
            alt={wildPokemon.name}
            size={110}
            animation={spriteAnims.wild as any}
          />
        </div>

        {/* Player name plate — bottom RIGHT */}
        <div style={{ position: "absolute", bottom: 50, right: 0, zIndex: 2 }}>
          <NamePlate
            name={playerPokemonInfo.name}
            level={playerPokemon.level}
            currentHp={battle.playerHp}
            maxHp={battle.playerMaxHp}
            side="player"
          />
        </div>

        {/* Player Pokemon sprite — bottom LEFT, on platform */}
        <div style={{
          position: "absolute",
          left: 50,
          bottom: 30,
          zIndex: 1,
        }}>
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
            className="gba-button"
            onClick={() => {
              playSfx("pokeball");
              enterCatchMode();
            }}
            style={{
              position: "absolute",
              right: 16,
              bottom: 8,
              fontSize: "0.45em",
              background: "#e84040",
              border: "3px solid #b83030",
              padding: "6px 12px",
              zIndex: 3,
            }}
          >
            POKéBALL!
          </button>
        )}
      </div>

      {/* Bottom text box panel — Emerald style */}
      <div style={{
        background: "linear-gradient(180deg, #a0a0a0 0%, #c8c8c0 3px, #f0f0e8 3px, #f0f0e8 100%)",
        borderTop: "4px solid #585858",
        padding: 0,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Wrong answer feedback */}
        {battle.turnResult && !battle.turnResult.correct && (
          <div style={{
            fontSize: "0.5em",
            color: "#c03028",
            textAlign: "center",
            padding: "6px 16px 0",
            fontFamily: "'Press Start 2P', monospace",
          }}>
            {battle.turnResult.question.factorA} x {battle.turnResult.question.factorB} = {battle.turnResult.correctAnswer}
          </div>
        )}

        {battle.status === "active" && !battle.catchMode && (
          <div style={{ padding: "10px 16px", flex: 1, display: "flex", alignItems: "center" }}>
            <QuestionInput
              question={battle.currentQuestion}
              onSubmit={onAnswer}
              disabled={battle.status !== "active"}
            />
          </div>
        )}

        {battle.catchMode && (
          <div style={{ padding: "10px 16px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <p style={{
              fontSize: "0.5em", color: "#585858", fontFamily: "'Press Start 2P', monospace",
            }}>
              Catch question! Get it right!
            </p>
            <QuestionInput question={battle.currentQuestion} onSubmit={onAnswer} />
          </div>
        )}
      </div>
    </div>
  );
}
