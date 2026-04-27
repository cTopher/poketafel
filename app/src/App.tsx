import { useState, useEffect } from "react";
import { GbaFrame } from "./components/GbaFrame";
import { useAuth } from "./hooks/useAuth";
import { LoginScreen } from "./screens/LoginScreen";
import { StarterSelectScreen } from "./screens/StarterSelectScreen";
import { HubScreen } from "./screens/HubScreen";
import { BattleScreen } from "./screens/BattleScreen";
import { BattleResultScreen } from "./screens/BattleResultScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { api } from "./lib/api-client";
import { getPokemon, type PokemonBasicInfo } from "./lib/pokeapi";
import { xpToNextLevel } from "@shared/types";
import type { Screen, BattleResult } from "@shared/types";
import { checkEvolution } from "./lib/evolution";
import styles from "./App.module.css";

export function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState<Screen>("login");
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [playerPokemonInfo, setPlayerPokemonInfo] =
    useState<PokemonBasicInfo | null>(null);
  const [caughtPokemonInfo, setCaughtPokemonInfo] =
    useState<PokemonBasicInfo | null>(null);

  const activePokemon =
    auth.collection.find((p) => p.is_active) ?? auth.collection[0];
  const activePokemonPokeapiId = activePokemon?.pokeapi_id;

  useEffect(() => {
    if (activePokemonPokeapiId !== undefined) {
      void getPokemon(activePokemonPokeapiId).then(setPlayerPokemonInfo);
    }
  }, [activePokemonPokeapiId]);

  useEffect(() => {
    if (auth.trainer && !auth.loading) {
      setScreen(auth.hasStarter ? "hub" : "starter-select");
    }
  }, [auth.trainer, auth.hasStarter, auth.loading]);

  if (auth.loading) {
    return (
      <GbaFrame>
        <div className={styles.loading}>LOADING...</div>
      </GbaFrame>
    );
  }

  if (!auth.trainer) {
    return (
      <GbaFrame>
        <LoginScreen onLogin={auth.login} />
      </GbaFrame>
    );
  }

  async function handleBattleEnd(result: BattleResult) {
    if (activePokemon && result.outcome !== "lost") {
      const newXp = activePokemon.xp + result.xpGained;
      const needed = xpToNextLevel(activePokemon.level);
      const leveledUp = newXp >= needed;
      const newLevel = leveledUp
        ? activePokemon.level + 1
        : activePokemon.level;

      await api.updatePokemon({
        pokemon_id: activePokemon.id,
        xp: leveledUp ? newXp - needed : newXp,
        level: leveledUp ? newLevel : undefined,
      });

      if (leveledUp) {
        const evoCheck = await checkEvolution(
          activePokemon.pokeapi_id,
          newLevel,
        );
        if (evoCheck.shouldEvolve && evoCheck.evolvesToId) {
          result = {
            ...result,
            leveledUp: true,
            newLevel,
            evolved: true,
            evolvedTo: evoCheck.evolvesToId,
          };
        }
      }
    }

    if (result.caughtPokemon) {
      const info = await getPokemon(result.caughtPokemon.pokeapiId);
      setCaughtPokemonInfo(info);
    }

    setBattleResult(result);

    const collection = await api.getCollection();
    auth.updateCollection(collection);

    setScreen("battle-result");
  }

  return (
    <GbaFrame>
      {screen === "starter-select" && (
        <StarterSelectScreen
          onSelect={async (pokeapiId) => {
            const caught = await api.catchPokemon({
              pokeapi_id: pokeapiId,
              level: 5,
            });
            await api.updatePokemon({
              pokemon_id: caught.id,
              set_active: true,
            });
            const collection = await api.getCollection();
            auth.updateCollection(collection);
            setScreen("hub");
          }}
        />
      )}

      {screen === "hub" && activePokemon && (
        <HubScreen
          trainer={auth.trainer}
          activePokemon={activePokemon}
          collectionCount={auth.collection.length}
          onNavigate={setScreen}
        />
      )}

      {screen === "battle" && activePokemon && playerPokemonInfo && (
        <BattleScreen
          playerPokemon={activePokemon}
          playerPokemonInfo={playerPokemonInfo}
          difficultyRows={auth.difficulty}
          collection={auth.collection}
          onEnd={handleBattleEnd}
          onCollectionUpdate={auth.updateCollection}
        />
      )}

      {screen === "battle-result" && battleResult && playerPokemonInfo && (
        <BattleResultScreen
          result={battleResult}
          playerPokemonInfo={playerPokemonInfo}
          caughtPokemonInfo={caughtPokemonInfo ?? undefined}
          onContinue={() => {
            setBattleResult(null);
            setCaughtPokemonInfo(null);
            setScreen("hub");
          }}
        />
      )}

      {screen === "collection" && (
        <CollectionScreen
          collection={auth.collection}
          onBack={() => {
            setScreen("hub");
          }}
          onCollectionUpdate={auth.updateCollection}
        />
      )}
    </GbaFrame>
  );
}
