import styles from "./BattleChoices.module.css";

interface BattleChoicesProps {
  choices: number[];
  onAnswer: (answer: number) => void;
  onBack?: () => void;
}

export function BattleChoices({ choices, onAnswer, onBack }: BattleChoicesProps) {
  return (
    <div className={styles.container}>
      <div className={styles.choicesGrid}>
        {choices.map((choice, i) => (
          <button
            key={i}
            className={styles.choiceButton}
            onClick={() => onAnswer(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      {onBack && (
        <button className={styles.backButton} onClick={onBack}>
          BACK
        </button>
      )}
    </div>
  );
}
