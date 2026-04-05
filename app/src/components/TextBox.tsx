import type { ReactNode } from "react";

interface TextBoxProps { children: ReactNode; className?: string; }

export function TextBox({ children, className = "" }: TextBoxProps) {
  return (
    <div className={className} style={{
      background: "var(--gba-white)", color: "var(--gba-dark)",
      border: "4px solid var(--gba-dark)", borderRadius: 8,
      padding: "12px 16px", fontSize: "0.65em", lineHeight: 1.8,
      boxShadow: "inset -2px -2px 0 var(--gba-border)",
    }}>
      {children}
    </div>
  );
}
