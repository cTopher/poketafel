import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Question } from "@shared/types";

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
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "center",
        width: "100%",
      }}
    >
      <span style={{
        fontSize: "1.1em",
        color: "#383838",
        fontFamily: "'Press Start 2P', monospace",
      }}>
        {question.factorA} x {question.factorB} =
      </span>
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus
        style={{
          width: 80,
          textAlign: "center",
          fontSize: "1em",
          fontFamily: "'Press Start 2P', monospace",
          background: "#fff",
          color: "#383838",
          border: "3px solid #585858",
          borderRadius: 4,
          padding: "6px 8px",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={disabled || value === ""}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "0.6em",
          background: "#4888c8",
          color: "#fff",
          border: "3px solid #385888",
          borderRadius: 4,
          padding: "8px 14px",
          cursor: disabled || value === "" ? "default" : "pointer",
          opacity: disabled || value === "" ? 0.5 : 1,
          textShadow: "1px 1px 0 #283858",
        }}
      >
        GO!
      </button>
    </form>
  );
}
