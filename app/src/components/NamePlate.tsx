import { HpBar } from "./HpBar";
import styles from "./NamePlate.module.css";

interface NamePlateProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  side: "enemy" | "player";
  xp?: number;
  xpToNext?: number;
}

export function NamePlate({
  name,
  level,
  currentHp,
  maxHp,
  side,
  xp,
  xpToNext,
}: NamePlateProps) {
  const isPlayer = side === "player";

  return (
    <div
      className={`${styles.plate} ${isPlayer ? styles.platePlayer : styles.plateEnemy}`}
    >
      <div className={styles.nameRow}>
        <span
          className={`${styles.name} ${isPlayer ? styles.namePlayer : styles.nameEnemy}`}
        >
          {name}
        </span>
        <span className={styles.level}>Lv{level}</span>
      </div>

      <div className={styles.hpArea}>
        <HpBar
          current={currentHp}
          max={maxHp}
          width={isPlayer ? 130 : 120}
          showNumbers={isPlayer}
        />
      </div>

      {isPlayer && xp !== undefined && xpToNext !== undefined && (
        <div className={styles.xpBarWrapper}>
          <span className={styles.xpLabel}>EXP</span>
          <div className={styles.xpTrack}>
            <div
              className={styles.xpFill}
              style={{ width: `${Math.min(100, (xp / xpToNext) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
