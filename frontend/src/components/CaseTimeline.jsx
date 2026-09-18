import React from "react";

const STAGES = [
  { id: "DRAFT", label: "Draft" },
  { id: "APPROVED", label: "Approved" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "UNDER_REVIEW", label: "Under Review" },
  { id: "ACTION_IN_PROGRESS", label: "Action in Progress" },
  { id: "RESOLVED", label: "Resolved" },
];

export default function CaseTimeline({ status }) {
  const currentIndex = STAGES.findIndex((s) => s.id === status);

  return (
    <ol className="flex flex-col gap-0">
      {STAGES.map((stage, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STAGES.length - 1;

        return (
          <li key={stage.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-[7px] top-4 h-full w-px ${
                  isDone ? "bg-accent" : "bg-line"
                }`}
              />
            )}
            <span
              className={`relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                isCurrent
                  ? "border-accent bg-accent"
                  : isDone
                  ? "border-accent bg-accent"
                  : "border-line bg-white"
              }`}
              aria-hidden="true"
            />
            <div>
              <p
                className={`text-[14px] font-medium ${
                  isCurrent ? "text-ink-900" : isDone ? "text-ink-700" : "text-ink-300"
                }`}
              >
                {stage.label}
              </p>
              {isCurrent && (
                <p className="text-[12px] text-accent-dark">Current status</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
