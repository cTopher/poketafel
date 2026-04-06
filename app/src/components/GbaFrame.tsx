import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./GbaFrame.module.css";

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;

export function GbaFrame({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / BASE_WIDTH, vh / BASE_HEIGHT));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
}
