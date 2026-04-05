interface HpBarProps {
  current: number;
  max: number;
  width?: number;
}

export function HpBar({ current, max, width = 120 }: HpBarProps) {
  const pct = Math.max(0, current / max);
  const color =
    pct > 0.5 ? "var(--gba-hp-green)" : pct > 0.25 ? "var(--gba-hp-yellow)" : "var(--gba-hp-red)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: "0.45em", color: "var(--gba-gold)" }}>HP</span>
      <div
        style={{
          width,
          height: 8,
          background: "var(--gba-dark)",
          borderRadius: 4,
          border: "1px solid var(--gba-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.5s ease-out, background 0.3s",
          }}
        />
      </div>
      <span style={{ fontSize: "0.35em", minWidth: 50, textAlign: "right" }}>
        {current}/{max}
      </span>
    </div>
  );
}
