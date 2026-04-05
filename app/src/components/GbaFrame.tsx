import { useEffect, useRef, useState, type ReactNode } from "react";

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
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div ref={containerRef} style={{
      width: BASE_WIDTH, height: BASE_HEIGHT,
      transform: `scale(${scale})`, transformOrigin: "center center",
      position: "relative", overflow: "hidden",
      background: "linear-gradient(180deg, var(--gba-dark) 0%, var(--gba-bg) 100%)",
      borderRadius: 8,
    }}>
      {children}
    </div>
  );
}
