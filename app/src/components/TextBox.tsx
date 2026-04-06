import type { ReactNode } from "react";

interface TextBoxProps { children: ReactNode; className?: string; }

export function TextBox({ children, className = "" }: TextBoxProps) {
  return (
    <div className={`emerald-textbox ${className}`}>
      {children}
    </div>
  );
}
