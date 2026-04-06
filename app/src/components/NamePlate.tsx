import { HpBar } from "./HpBar";

interface NamePlateProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  side: "enemy" | "player";
}

export function NamePlate({ name, level, currentHp, maxHp, side }: NamePlateProps) {
  const isPlayer = side === "player";

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f0f0e0 0%, #c8c8b8 100%)",
        border: "3px solid #585858",
        padding: "6px 12px 8px",
        minWidth: isPlayer ? 210 : 190,
        boxShadow: "2px 3px 0 rgba(0,0,0,0.25)",
        position: "relative",
        // Emerald plates extend to the edge of the screen
        ...(isPlayer
          ? { borderRadius: "8px 0 0 8px", borderRight: "none" }
          : { borderRadius: "0 8px 8px 0", borderLeft: "none" }),
      }}
    >
      {/* Name and level row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 4,
        gap: 10,
      }}>
        <span style={{
          fontSize: "0.5em",
          fontFamily: "'Press Start 2P', monospace",
          color: "#383838",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: isPlayer ? 120 : 110,
        }}>
          {name}
        </span>
        <span style={{
          fontSize: "0.45em",
          fontFamily: "'Press Start 2P', monospace",
          color: "#585858",
          whiteSpace: "nowrap",
        }}>
          Lv{level}
        </span>
      </div>

      {/* HP bar area with label */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}>
        <HpBar
          current={currentHp}
          max={maxHp}
          width={isPlayer ? 130 : 120}
          showNumbers={isPlayer}
        />
      </div>
    </div>
  );
}
