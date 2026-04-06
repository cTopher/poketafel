import { useState } from "react";
import type { SubmitEvent as ReactSubmitEvent } from "react";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
  onLogin: (name: string, favoriteNum: number) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState("");
  const [favoriteNum, setFavoriteNum] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: ReactSubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const trimmedName = name.trim();
    const num = parseInt(favoriteNum, 10);
    if (!trimmedName) {
      setError("Enter your name!");
      return;
    }
    if (isNaN(num) || num < 1 || num > 999) {
      setError("Pick a number from 1 to 999!");
      return;
    }
    setLoading(true);
    try {
      await onLogin(trimmedName, num);
    } catch {
      setError("Something went wrong. Try again!");
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>POKéTAFEL</h1>
      <p className={styles.subtitle}>Gotta Multiply &apos;Em All!</p>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className={styles.form}
      >
        <div className={`emerald-textbox ${styles.formBox}`}>
          <div className={styles.fields}>
            <label className={styles.label}>
              YOUR NAME
              <input
                className={`gba-input ${styles.labelInput}`}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                maxLength={20}
                autoFocus
              />
            </label>
            <label className={styles.label}>
              FAVORITE NUMBER
              <input
                className={`gba-input ${styles.labelInput}`}
                type="number"
                min={1}
                max={999}
                value={favoriteNum}
                onChange={(e) => {
                  setFavoriteNum(e.target.value);
                }}
              />
            </label>
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={`gba-button ${styles.submitButton}`}
          type="submit"
          disabled={loading}
        >
          {loading ? "LOADING..." : "START!"}
        </button>
      </form>
    </div>
  );
}
