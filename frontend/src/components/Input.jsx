import React, { useId } from "react";

export default function Input({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
  id,
  required = false,
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
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-300 focus:border-accent"
        {...rest}
      />
    </div>
  );
}
