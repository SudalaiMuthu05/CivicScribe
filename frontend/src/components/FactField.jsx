import React from "react";
import Input from "./Input.jsx";
import Textarea from "./Textarea.jsx";
import Select from "./Select.jsx";

/**
 * A single editable fact row. `type` controls the control rendered:
 * "text" | "textarea" | "boolean" | "date" | "list"
 */
export default function FactField({ label, type = "text", value, onChange }) {
  if (type === "boolean") {
    return (
      <Select
        label={label}
        value={value === true ? "yes" : value === false ? "no" : ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value === "yes")
        }
        options={[
          { value: "", label: "Not specified" },
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
    );
  }

  if (type === "textarea") {
    return (
      <Textarea
        label={label}
        rows={3}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === "list") {
    const text = Array.isArray(value) ? value.join("\n") : value || "";
    return (
      <Textarea
        label={label}
        hint="One detail per line."
        rows={3}
        value={text}
        onChange={(e) =>
          onChange(e.target.value.split("\n").filter((line) => line.trim() !== ""))
        }
      />
    );
  }

  return (
    <Input
      label={label}
      type={type === "date" ? "date" : "text"}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
