import { useState, useEffect } from "react";
import type { OwnedPokemon, DifficultyRow, BattleResult } from "@shared/types";
import { xpToNextLevel } from "@shared/types";
import { useBattle } from "../hooks/useBattle";
import { useSound } from "../hooks/useSound";
import { getPokemon, randomWildPokemonId, type PokemonBasicInfo } from "../lib/pokeapi";
import { HpBar } from "../components/HpBar";
import { PokemonSprite } from "../components/PokemonSprite";
import { QuestionInput } from "../components/QuestionInput";
import { TextBox } from "../components/TextBox";
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
  const { playSfx, playCry } = useSound();

  // Load wild pokemon on mount
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.7em", color: "var(--gba-gold)" }}>
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

    // Reset animations
    setTimeout(() => setSpriteAnims({ wild: "idle", player: "idle" }), 400);

    if (result.status !== "active") {
      setTimeout(() => finishBattle(result.status), 800);
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #73bef3 0%, #73bef3 45%, #63c74d 45%, #4a8f39 100%)",
      }}
    >
      {/* Battle arena — top section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", position: "relative" }}>
        {/* Wild Pokemon — top right */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start", gap: 16 }}>
          <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: "0.6em", textTransform: "uppercase", marginBottom: 4 }}>{wildPokemon.name}</div>
            <HpBar current={battle.wildHp} max={battle.wildMaxHp} />
          </div>
          <PokemonSprite
            src={wildInfo.spriteFront}
            alt={wildPokemon.name}
            size={120}
            animation={spriteAnims.wild as any}
          />
        </div>

        {/* Player Pokemon — bottom left */}
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 16, marginTop: "auto" }}>
          <PokemonSprite
            src={playerPokemonInfo.spriteBack}
            alt={playerPokemon.nickname ?? playerPokemonInfo.name}
            size={120}
            animation={spriteAnims.player as any}
          />
          <div style={{ background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: "0.6em", textTransform: "uppercase", marginBottom: 4 }}>
              {playerPokemonInfo.name} <span style={{ fontSize: "0.7em", color: "var(--gba-gold)" }}>Lv.{playerPokemon.level}</span>
            </div>
            <HpBar current={battle.playerHp} max={battle.playerMaxHp} />
          </div>
        </div>
      </div>

      {/* Bottom UI panel */}
      <div style={{ padding: "12px 24px 16px", background: "var(--gba-dark)", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Show turn result message */}
        {battle.turnResult && !battle.turnResult.correct && (
          <div style={{ fontSize: "0.5em", color: "var(--gba-red)", textAlign: "center", padding: 4 }}>
            {battle.turnResult.question.factorA} × {battle.turnResult.question.factorB} = {battle.turnResult.correctAnswer}
          </div>
        )}

        {battle.status === "active" && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <QuestionInput
                question={battle.currentQuestion}
                onSubmit={onAnswer}
                disabled={battle.status !== "active"}
              />
            </div>

            {battle.canCatch && !battle.catchMode && (
              <button
                className="gba-button"
                onClick={() => {
                  playSfx("pokeball");
                  enterCatchMode();
                }}
                style={{ fontSize: "0.5em", background: "var(--gba-red)", whiteSpace: "nowrap" }}
              >
                POKéBALL!
              </button>
            )}
          </div>
        )}

        {battle.catchMode && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.5em", color: "var(--gba-gold)", marginBottom: 8 }}>
              Catch question! Get it right to catch {wildPokemon.name}!
            </p>
            <QuestionInput question={battle.currentQuestion} onSubmit={onAnswer} />
          </div>
        )}
      </div>
    </div>
  );
}
