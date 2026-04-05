import { useState, type FormEvent } from "react";
import { TextBox } from "../components/TextBox";

interface LoginScreenProps {
  onLogin: (name: string, favoriteNum: number) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [favoriteNum, setFavoriteNum] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const num = parseInt(favoriteNum, 10);
    if (!trimmedName) { setError("Enter your name!"); return; }
    if (isNaN(num) || num < 1 || num > 999) { setError("Pick a number from 1 to 999!"); return; }
    setLoading(true);
    try { await onLogin(trimmedName, num); } catch { setError("Something went wrong. Try again!"); setLoading(false); }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 40,
      background: "linear-gradient(180deg, #1a3c6e 0%, #0f2847 50%, #1a1c2c 100%)",
    }}>
      <h1 style={{ fontSize: "2em", color: "var(--gba-gold)", textShadow: "3px 3px 0 var(--gba-dark), -1px -1px 0 var(--gba-orange)", letterSpacing: 2 }}>
        POKéTAFEL
      </h1>
      <p style={{ fontSize: "0.55em", color: "var(--gba-yellow)", textShadow: "1px 1px 0 var(--gba-dark)" }}>
        Gotta Multiply 'Em All!
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, width: 360 }}>
        <TextBox>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: "0.65em" }}>
              YOUR NAME
              <input className="gba-input" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus style={{ marginTop: 6, display: "block" }} />
            </label>
            <label style={{ fontSize: "0.65em" }}>
              FAVORITE NUMBER
              <input className="gba-input" type="number" min={1} max={999} value={favoriteNum} onChange={(e) => setFavoriteNum(e.target.value)} style={{ marginTop: 6, display: "block" }} />
            </label>
          </div>
        </TextBox>
        {error && <p style={{ fontSize: "0.5em", color: "var(--gba-red)", textAlign: "center" }}>{error}</p>}
        <button className="gba-button" type="submit" disabled={loading} style={{ alignSelf: "center", fontSize: "0.65em" }}>
          {loading ? "LOADING..." : "START!"}
        </button>
      </form>
    </div>
  );
}
