import type { ReactNode } from "react";
import styles from "./GbaFrame.module.css";

export function GbaFrame({ children }: { children: ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
