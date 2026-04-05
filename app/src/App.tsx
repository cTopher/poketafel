import { GbaFrame } from "./components/GbaFrame";
import { TextBox } from "./components/TextBox";

export function App() {
  return (
    <GbaFrame>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 24 }}>
        <h1 style={{ fontSize: "1.5em", color: "var(--gba-gold)", textShadow: "2px 2px 0 var(--gba-dark)" }}>POKéTAFEL</h1>
        <TextBox>Gotta Multiply 'Em All!</TextBox>
      </div>
    </GbaFrame>
  );
}
