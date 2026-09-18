import React, { useId } from "react";

export default function Textarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 5,
  maxLength,
  showCount = false,
  required = false,
  id,
  ...rest
}) {
  const autoId = useId();
  const fieldId = id || autoId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-[14px] font-medium text-ink-900">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {hint && <p className="mb-2 text-[13px] text-ink-500">{hint}</p>}
      <textarea
        id={fieldId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        className="w-full resize-vertical rounded-md border border-line bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-accent"
        {...rest}
      />
      {showCount && maxLength && (
        <p className="mt-1.5 text-right text-[12px] text-ink-300">
          {(value || "").length} / {maxLength}
        </p>
      )}
    </div>
  );
}
