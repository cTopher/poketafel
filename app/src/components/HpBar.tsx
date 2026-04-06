interface HpBarProps {
  current: number;
  max: number;
  width?: number;
  showNumbers?: boolean;
}

export function HpBar({ current, max, width = 120, showNumbers = false }: HpBarProps) {
  const pct = Math.max(0, current / max);
  const color =
    pct > 0.5 ? "#6be048" : pct > 0.25 ? "#f8d030" : "#f04038";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{
          fontSize: "0.4em",
          fontWeight: "bold",
          color: "#f8b800",
          textShadow: "1px 1px 0 #785800",
          letterSpacing: 1,
        }}>
          HP
        </span>
        <div
          style={{
            width,
            height: 4,
            background: "#383838",
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid #181818",
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: color,
              borderRadius: 1,
              transition: "width 0.5s ease-out, background 0.3s",
              boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </div>
      {showNumbers && (
        <div style={{
          fontSize: "0.4em",
          textAlign: "right",
          color: "#383838",
          fontFamily: "'Press Start 2P', monospace",
        }}>
          {current}<span style={{ color: "#888" }}>/</span>{max}
        </div>
      )}
    </div>
  );
}
