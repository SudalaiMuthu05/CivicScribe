import React from "react";

export default function Card({ children, className = "", as = "div", ...rest }) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-lg border border-line bg-white p-6 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
