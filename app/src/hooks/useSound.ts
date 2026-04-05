import { useCallback, useRef } from "react";

type SfxName = "hit" | "damage" | "correct" | "wrong" | "catch" | "levelup" | "pokeball";

// Simple synthesized sounds using Web Audio API — no external files needed
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }

  const playSfx = useCallback((name: SfxName) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);

    switch (name) {
      case "correct":
        osc.type = "square";
        osc.frequency.setValueAtTime(523, now);       // C5
        osc.frequency.setValueAtTime(659, now + 0.08); // E5
        osc.frequency.setValueAtTime(784, now + 0.16); // G5
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case "wrong":
        osc.type = "square";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case "hit":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case "damage":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case "catch":
        osc.type = "square";
        osc.frequency.setValueAtTime(392, now);        // G4
        osc.frequency.setValueAtTime(523, now + 0.1);  // C5
        osc.frequency.setValueAtTime(659, now + 0.2);  // E5
        osc.frequency.setValueAtTime(784, now + 0.3);  // G5
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case "levelup":
        osc.type = "square";
        osc.frequency.setValueAtTime(262, now);        // C4
        osc.frequency.setValueAtTime(330, now + 0.08); // E4
        osc.frequency.setValueAtTime(392, now + 0.16); // G4
        osc.frequency.setValueAtTime(523, now + 0.24); // C5
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case "pokeball":
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(300, now + 0.15);
        osc.frequency.setValueAtTime(600, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  }, []);

  const playCry = useCallback((cryUrl: string) => {
    const audio = new Audio(cryUrl);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

  return { playSfx, playCry };
}
