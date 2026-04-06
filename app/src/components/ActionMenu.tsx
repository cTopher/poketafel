import styles from "./ActionMenu.module.css";

interface ActionMenuProps {
  onFight: () => void;
  onPokemon: () => void;
  onCatch: () => void;
  onRun: () => void;
  catchEnabled: boolean;
}

export function ActionMenu({
  onFight,
  onPokemon,
  onCatch,
  onRun,
  catchEnabled,
}: ActionMenuProps) {
  return (
    <div className={styles.grid}>
      <button
        className={`${styles.actionButton} ${styles.fight}`}
        onClick={onFight}
      >
        FIGHT
      </button>
      <button
        className={`${styles.actionButton} ${styles.pokemon}`}
        onClick={onPokemon}
      >
        POKéMON
      </button>
      <button
        className={`${styles.actionButton} ${styles.catch} ${!catchEnabled ? styles.disabled : ""}`}
        onClick={catchEnabled ? onCatch : undefined}
        disabled={!catchEnabled}
      >
        CATCH
      </button>
      <button
        className={`${styles.actionButton} ${styles.run}`}
        onClick={onRun}
      >
        RUN
      </button>
    </div>
  );
}
