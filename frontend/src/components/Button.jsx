import React from "react";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-dark disabled:bg-ink-300 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-ink-900 border border-line hover:border-ink-500 hover:bg-white",
  ghost:
    "bg-transparent text-ink-700 hover:text-ink-900 hover:bg-white/60",
  danger:
    "bg-danger text-white hover:bg-danger/90 disabled:bg-ink-300 disabled:cursor-not-allowed",
};

export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[15px] font-medium transition-colors duration-200 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
