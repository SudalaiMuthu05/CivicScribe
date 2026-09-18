import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
  onBack,
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-lg border border-danger/20 bg-danger-light px-6 py-12 text-center"
    >
      <AlertTriangle size={22} className="text-danger" aria-hidden="true" />
      <p className="max-w-md text-[15px] font-medium text-ink-900">{message}</p>
      <div className="flex gap-3">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
      </div>
    </div>
  );
}
