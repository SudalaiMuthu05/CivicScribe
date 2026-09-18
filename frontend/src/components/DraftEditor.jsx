import React, { useState } from "react";
import { FileText, Edit3, Copy, Check, Printer } from "lucide-react";
import Input from "./Input.jsx";
import Textarea from "./Textarea.jsx";

// Helper to ensure any markdown remnants are cleaned
function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^---+\s*$/gm, "")
    .replace(/^[\*\-]\s+/gm, "• ");
}

export default function DraftEditor({ draft, onChange, requestType, category }) {
  const [mode, setMode] = useState("document"); // "document" | "edit"
  const [copied, setCopied] = useState(false);

  const set = (field) => (e) => {
    let cleanedVal = stripMarkdown(e.target.value);
    if (field === "to") {
      cleanedVal = cleanedVal.replace(/^to\s*[:,-]?\s*/i, "");
    }
    onChange({ ...draft, [field]: cleanedVal });
  };

  const handleCopy = async () => {
    const cleanTo = (stripMarkdown(draft.to) || "").replace(/^to\s*[:,-]?\s*/i, "").trim();
    const fullText = [
      cleanTo ? `To:\n${cleanTo}` : "",
      draft.subject ? `\nSubject: ${stripMarkdown(draft.subject).trim()}\n` : "",
      stripMarkdown(draft.body) || "",
      draft.closing ? `\n${stripMarkdown(draft.closing)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isRti = requestType?.toUpperCase() === "RTI";
  const documentTitle = isRti
    ? "APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005"
    : "FORMAL PUBLIC GRIEVANCE PETITION";

  const todayStr = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Document Review Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-xs">
        {/* Mode Switcher */}
        <div className="inline-flex rounded-md border border-line bg-paper p-0.5">
          <button
            type="button"
            onClick={() => setMode("document")}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition ${
              mode === "document"
                ? "bg-white text-ink-900 shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <FileText size={15} />
            Document View
          </button>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition ${
              mode === "edit"
                ? "bg-white text-ink-900 shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <Edit3 size={15} />
            Edit Sections
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700 hover:bg-paper transition"
            title="Copy application text"
          >
            {copied ? (
              <>
                <Check size={14} className="text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-ink-500" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink-700 hover:bg-paper transition"
            title="Print application"
          >
            <Printer size={14} className="text-ink-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {mode === "document" ? (
        /* Formal Civic Document Paper */
        <div className="relative rounded-lg border border-line bg-white p-8 md:p-10 shadow-xs transition print:border-0 print:p-0 print:shadow-none">
          {/* Official Letterhead Strip */}
          <div className="border-b-2 border-ink-900/10 pb-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
              Formal Civic Document
            </p>
            <h2 className="mt-1 text-[17px] font-bold uppercase tracking-wide text-ink-900 sm:text-[19px]">
              {documentTitle}
            </h2>
            {category && (
              <p className="mt-1 text-[13px] font-medium text-ink-500">
                Department / Category: {stripMarkdown(category)}
              </p>
            )}
            <div className="mt-3 flex justify-end text-[12px] text-ink-500">
              <span>Date: {todayStr}</span>
            </div>
          </div>

          {/* Addressee (To) */}
          <div className="mt-6">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-500">
              To:
            </p>
            <div className="mt-1.5 whitespace-pre-line text-[15px] font-medium leading-relaxed text-ink-900">
              {(stripMarkdown(draft.to) || "").replace(/^to\s*[:,-]?\s*/i, "") || "The Competent Authority"}
            </div>
          </div>

          {/* Subject Line */}
          {draft.subject && (
            <div className="mt-6 rounded-md border-l-4 border-accent bg-accent-light/40 px-4 py-3">
              <p className="text-[14px] font-semibold text-ink-900 leading-snug">
                <span className="font-bold uppercase tracking-wide text-accent-dark">Subject: </span>
                {stripMarkdown(draft.subject)}
              </p>
            </div>
          )}

          {/* Body Content */}
          <div className="mt-6 space-y-4 border-t border-line/50 pt-5 text-[15px] leading-relaxed text-ink-900">
            {stripMarkdown(draft.body)
              .split("\n\n")
              .filter((p) => p.trim() !== "")
              .map((para, i) => {
                const lines = para.split("\n");
                return (
                  <div key={i} className="space-y-1.5">
                    {lines.map((line, j) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
                        const content = trimmed.replace(/^[\•\-]\s*/, "");
                        return (
                          <div key={j} className="ml-3 flex items-start gap-2.5 py-0.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="text-[15px] leading-relaxed text-ink-900">
                              {stripMarkdown(content)}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <p key={j} className="text-[15px] leading-relaxed text-ink-900">
                          {stripMarkdown(line)}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          {/* Formal Closing / Signature */}
          <div className="mt-8 border-t border-line/50 pt-6">
            <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink-900">
              {stripMarkdown(draft.closing) || "Yours faithfully,\n[Name]\n[Address]\n[Contact Number]"}
            </div>
          </div>

          {/* Quick Edit prompt button at bottom of sheet */}
          <div className="mt-8 flex justify-end border-t border-line/40 pt-4 print:hidden">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-dark transition"
            >
              <Edit3 size={14} />
              Edit text of this application
            </button>
          </div>
        </div>
      ) : (
        /* Edit Sections Form */
        <div className="flex flex-col gap-5 rounded-lg border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-[15px] font-semibold text-ink-900">Edit Application Sections</h3>
              <p className="text-[12px] text-ink-500">
                Update the recipient, subject, body, or closing. Markdown syntax is automatically sanitized.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode("document")}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-white"
            >
              <FileText size={13} />
              View Formatted Document
            </button>
          </div>

          <Textarea
            label="To (Addressee / Authority)"
            rows={3}
            value={(stripMarkdown(draft.to) || "").replace(/^to\s*[:,-]?\s*/i, "")}
            onChange={set("to")}
            hint="Department name, competent officer, or government body"
          />

          <Input
            label="Subject"
            value={stripMarkdown(draft.subject) || ""}
            onChange={set("subject")}
          />

          <Textarea
            label="Application Body"
            rows={14}
            value={stripMarkdown(draft.body) || ""}
            onChange={set("body")}
            hint="Describe the request and facts. Formal bullets can be indicated with •"
          />

          <Textarea
            label="Closing & Sign-off"
            rows={3}
            value={stripMarkdown(draft.closing) || ""}
            onChange={set("closing")}
            hint="Salutation, applicant placeholders like [Name], [Address], [Contact Number]"
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setMode("document")}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-dark transition"
            >
              <FileText size={14} />
              Done Editing & Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
