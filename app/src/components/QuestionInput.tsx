import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Question } from "@shared/types";
import styles from "./QuestionInput.module.css";

interface QuestionInputProps {
  question: Question;
  onSubmit: (answer: number) => void;
  disabled?: boolean;
}

export function QuestionInput({ question, onSubmit, disabled = false }: QuestionInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [question.factorA, question.factorB]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    onSubmit(num);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <span className={styles.questionText}>
        {question.factorA} x {question.factorB} =
      </span>
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus
        className={styles.input}
      />
      <button
        type="submit"
        disabled={disabled || value === ""}
        className={styles.submitButton}
      >
        GO!
      </button>
    </form>
  );
}
