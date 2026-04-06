import { HpBar } from "./HpBar";
import styles from "./NamePlate.module.css";

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
    <div className={`${styles.plate} ${isPlayer ? styles.platePlayer : styles.plateEnemy}`}>
      <div className={styles.nameRow}>
        <span className={`${styles.name} ${isPlayer ? styles.namePlayer : styles.nameEnemy}`}>
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
    </div>
  );
}
