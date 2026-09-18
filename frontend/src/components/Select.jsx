import React, { useId } from "react";
import { ChevronDown } from "lucide-react";

export default function Select({ label, value, onChange, options, id, ...rest }) {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-[14px] font-medium text-ink-900">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={fieldId}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-md border border-line bg-white px-4 py-2.5 pr-10 text-[15px] text-ink-900 focus:border-accent"
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
      </div>
    </div>
  );
}
