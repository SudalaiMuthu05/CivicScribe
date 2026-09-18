import React from "react";
import { Check } from "lucide-react";

const STEPS = [
  { id: "describe", label: "Describe" },
  { id: "understand", label: "Understand" },
  { id: "details", label: "Details" },
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "created", label: "Created" },
];

export default function StepIndicator({ current }) {
  const normalizedCurrent =
    current === "submitted" || current === "case-created" || current === "case"
      ? "created"
      : current;
  const currentIndex = STEPS.findIndex((s) => s.id === normalizedCurrent);

  return (
    <nav aria-label="Application progress" className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium ${
                  isCurrent
                    ? "bg-accent text-white"
                    : isDone
                    ? "bg-accent-light text-accent-dark"
                    : "bg-white text-ink-300 border border-line"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    isCurrent
                      ? "bg-white/25"
                      : isDone
                      ? "bg-accent/15"
                      : "bg-paper"
                  }`}
                >
                  {isDone ? <Check size={12} strokeWidth={2.5} /> : index + 1}
                </span>
                {step.label}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px w-4 sm:w-8 ${
                    index < currentIndex ? "bg-accent" : "bg-line"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
