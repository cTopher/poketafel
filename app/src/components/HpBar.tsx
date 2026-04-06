import styles from "./HpBar.module.css";

interface HpBarProps {
  current: number;
  max: number;
  width?: number;
  showNumbers?: boolean;
}

export function HpBar({
  current,
  max,
  width = 120,
  showNumbers = false,
}: HpBarProps) {
  const pct = Math.max(0, current / max);
  const color = pct > 0.5 ? "#6be048" : pct > 0.25 ? "#f8d030" : "#f04038";

  return (
    <div className={styles.wrapper}>
      <div className={styles.barRow}>
        <span className={styles.label}>HP</span>
        <div className={styles.track} style={{ width }}>
          <div
            className={styles.fill}
            style={{ width: `${pct * 100}%`, background: color }}
          />
        </div>
      </div>
      {showNumbers && (
        <div className={styles.numbers}>
          {current}
          <span className={styles.separator}>/</span>
          {max}
        </div>
      )}
    </div>
  );
}
