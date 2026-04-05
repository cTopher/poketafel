import { useState, useEffect } from "react";
import { GbaFrame } from "./components/GbaFrame";
import { useAuth } from "./hooks/useAuth";
import { LoginScreen } from "./screens/LoginScreen";
import { StarterSelectScreen } from "./screens/StarterSelectScreen";
import { api } from "./lib/api-client";
import type { Screen } from "@shared/types";

export function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState<Screen>("login");

  // Navigate after auth state changes
  useEffect(() => {
    if (auth.trainer && !auth.loading) {
      setScreen(auth.hasStarter ? "hub" : "starter-select");
    }
  }, [auth.trainer, auth.hasStarter, auth.loading]);

  if (auth.loading) {
    return (
      <GbaFrame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.8em", color: "var(--gba-gold)" }}>
          LOADING...
        </div>
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

  if (screen === "starter-select") {
    return (
      <GbaFrame>
        <StarterSelectScreen
          onSelect={async (pokeapiId) => {
            const caught = await api.catchPokemon({ pokeapi_id: pokeapiId });
            await api.updatePokemon({ pokemon_id: caught.id, set_active: true });
            const collection = await api.getCollection();
            auth.updateCollection(collection);
            setScreen("hub");
          }}
        />
      </GbaFrame>
    );
  }

  // Hub and other screens — placeholder for now
  return (
    <GbaFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.7em", color: "var(--gba-gold)" }}>
        HUB — {auth.trainer.name} (coming next)
      </div>
    </GbaFrame>
  );
}
