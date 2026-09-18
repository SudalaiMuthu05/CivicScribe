import React from "react";

const tones = {
  neutral: "bg-ink-900/5 text-ink-700 border-ink-900/10",
  accent: "bg-accent-light text-accent-dark border-accent/20",
  success: "bg-success-light text-success border-success/20",
  warning: "bg-warning-light text-warning border-warning/20",
  danger: "bg-danger-light text-danger border-danger/20",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
