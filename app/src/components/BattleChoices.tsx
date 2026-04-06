import styles from "./BattleChoices.module.css";

interface BattleChoicesProps {
  choices: number[];
  onAnswer: (answer: number) => void | Promise<void>;
  onBack?: () => void;
}

export function BattleChoices({
  choices,
  onAnswer,
  onBack,
}: BattleChoicesProps) {
  return (
    <div className={styles.container}>
      <div className={styles.choicesGrid}>
        {choices.map((choice, i) => (
          <button
            key={i}
            className={styles.choiceButton}
            onClick={() => {
              void onAnswer(choice);
            }}
          >
            {choice}
          </button>
        ))}
      </div>
      {onBack && (
        <button className={styles.backButton} onClick={onBack}>
          &lt; BACK
        </button>
      )}
    </div>
  );
}
