import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center">
      {Icon && <Icon size={22} className="text-ink-300" aria-hidden="true" />}
      <p className="text-[15px] font-medium text-ink-900">{title}</p>
      {description && (
        <p className="max-w-sm text-[14px] text-ink-500">{description}</p>
      )}
      {action}
    </div>
  );
}
