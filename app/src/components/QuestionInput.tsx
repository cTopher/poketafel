import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Question } from "@shared/types";
import { TextBox } from "./TextBox";

interface QuestionInputProps {
  question: Question;
  onSubmit: (answer: number) => void;
  disabled?: boolean;
}

export function QuestionInput({ question, onSubmit, disabled = false }: QuestionInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on new question
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
    <TextBox>
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <span style={{ fontSize: "1.2em", color: "var(--gba-dark)" }}>
          {question.factorA} x {question.factorB} =
        </span>
        <input
          ref={inputRef}
          className="gba-input"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          style={{ width: 80, textAlign: "center", fontSize: "1em" }}
          autoFocus
        />
        <button
          className="gba-button"
          type="submit"
          disabled={disabled || value === ""}
          style={{ fontSize: "0.6em" }}
        >
          GO!
        </button>
      </form>
    </TextBox>
  );
}
