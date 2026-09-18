import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingState({ message = "Loading..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-white px-6 py-16 text-center"
    >
      <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
      <p className="text-[15px] font-medium text-ink-700">{message}</p>
    </div>
  );
}
