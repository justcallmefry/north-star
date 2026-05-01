import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function UnfoldCard({ children, className }: Props) {
  return (
    <div className={`animate-paper-unfold${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
