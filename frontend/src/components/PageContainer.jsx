import React from "react";

export default function PageContainer({ children, className = "", narrow = false }) {
  return (
    <main
      className={`mx-auto w-full px-4 sm:px-6 py-10 ${
        narrow ? "max-w-[760px]" : "max-w-content"
      } ${className}`}
    >
      {children}
    </main>
  );
}
