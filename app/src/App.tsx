import { GbaFrame } from "./components/GbaFrame";
import { useAuth } from "./hooks/useAuth";
import { LoginScreen } from "./screens/LoginScreen";
import type { Screen } from "@shared/types";
import { useState } from "react";

export function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState<Screen>("login");

  if (auth.loading) {
    return (
      <GbaFrame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.8em", color: "var(--gba-gold)" }}>LOADING...</div>
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

  if (!auth.hasStarter) {
    return (
      <GbaFrame>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.7em", color: "var(--gba-gold)" }}>STARTER SELECT (coming next)</div>
      </GbaFrame>
    );
  }

  return (
    <GbaFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.7em", color: "var(--gba-gold)" }}>HUB (coming soon)</div>
    </GbaFrame>
  );
}
