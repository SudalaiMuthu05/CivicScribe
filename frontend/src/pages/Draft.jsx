import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/PageContainer.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import Badge from "../components/Badge.jsx";
import DraftEditor from "../components/DraftEditor.jsx";
import SourceCard from "../components/SourceCard.jsx";
import Button from "../components/Button.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ConfirmationDialog from "../components/ConfirmationDialog.jsx";
import { useRequest } from "../context/RequestContext.jsx";
import { generateDraft, ApiError } from "../api/client.js";

function cleanMarkdown(text) {
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

function replaceDatePlaceholders(text) {
  if (!text) return "";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.replace(/\[(?:today's\s+|current\s+)?date\]/gi, today);
}

// Splits the clean text into editable sections: To / Subject / Body / Closing
function parseDraftText(rawText) {
  const cleaned = cleanMarkdown(replaceDatePlaceholders(rawText || ""));
  const lines = cleaned.split("\n");

  let toLines = [];
  let subject = "";
  let inTo = false;
  let subjectFound = false;
  const remainingLines = [];

  const closingPattern =
    /^(yours\s+(faithfully|sincerely|truly|respectfully)|sincerely|respectfully|thanking\s+you|with\s+regards|regards)/i;
  const toStartPattern = /^to\s*[:,-]?\s*(.*)$/i;
  const subjectPattern = /^(?:subject|sub)\s*[:\-]\s*(.*)$/i;
  const datePattern = /^(?:date\s*[:\-]\s*)?\d{1,2}\s+[A-Za-z]+\s+\d{4}$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!subjectFound) {
      const subMatch = trimmed.match(subjectPattern);
      if (subMatch) {
        subject = subMatch[1].trim();
        subjectFound = true;
        inTo = false;
        continue;
      }

      const toMatch = trimmed.match(toStartPattern);
      if (toMatch) {
        inTo = true;
        if (toMatch[1].trim()) {
          toLines.push(toMatch[1].trim());
        }
        continue;
      }

      if (inTo) {
        if (datePattern.test(trimmed) || /^date\s*[:\-]/i.test(trimmed)) {
          continue;
        }
        if (trimmed) {
          toLines.push(trimmed);
        }
        continue;
      }

      if (datePattern.test(trimmed) || /^date\s*[:\-]/i.test(trimmed)) {
        continue;
      }

      if (/^the\s+/i.test(trimmed) && toLines.length === 0) {
        inTo = true;
        toLines.push(trimmed);
        continue;
      }
    }

    remainingLines.push(line);
  }

  let bodyStartIndex = 0;
  while (bodyStartIndex < remainingLines.length) {
    const t = remainingLines[bodyStartIndex].trim();
    if (!t || toStartPattern.test(t) || subjectPattern.test(t) || /^date\s*[:\-]/i.test(t)) {
      bodyStartIndex++;
    } else {
      break;
    }
  }

  const cleanRemaining = remainingLines.slice(bodyStartIndex);
  const closingIdx = cleanRemaining.findIndex((l) => closingPattern.test(l.trim()));
  let body = "";
  let closing = "";

  if (closingIdx >= 0) {
    body = cleanRemaining.slice(0, closingIdx).join("\n").trim();
    closing = cleanRemaining.slice(closingIdx).join("\n").trim();
  } else {
    body = cleanRemaining.join("\n").trim();
  }

  return {
    to: toLines.join("\n").trim() || "The Competent Authority",
    subject: subject.trim(),
    body: body.trim(),
    closing:
      closing.trim() || "Yours faithfully,\n[Name]\n[Address]\n[Contact Number]",
  };
}

function composeDraftText(draft) {
  const parts = [];
  const cleanTo = (draft.to || "").trim().replace(/^to\s*[:,-]?\s*/i, "");
  if (cleanTo) parts.push(`To:\n${cleanTo}`);
  if (draft.subject?.trim()) parts.push(`\nSubject: ${draft.subject.trim()}`);
  parts.push("");
  if (draft.body?.trim()) parts.push(draft.body.trim());
  if (draft.closing?.trim()) {
    parts.push("");
    parts.push(draft.closing.trim());
  }
  return cleanMarkdown(parts.join("\n").trim());
}

export default function Draft() {
  const { analysis, facts, draft, sources, update } = useRequest();
  const [editedDraft, setEditedDraft] = useState(() => parseDraftText(draft));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!draft) return null;

  const handleDraftChange = (newDraft) => {
    setEditedDraft(newDraft);
    update({ draft: composeDraftText(newDraft) });
  };

  const handleRegenerate = async () => {
    setConfirmOpen(false);
    setRegenerating(true);
    setError(null);
    try {
      const result = await generateDraft(analysis.type, analysis.category, facts);
      const cleaned = replaceDatePlaceholders(result.draft);
      update({ draft: cleaned, sources: result.sources || [] });
      setEditedDraft(parseDraftText(cleaned));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Your draft could not be generated. Your information has not been lost."
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleBack = () => {
    update({ draft: composeDraftText(editedDraft) });
    navigate("/details");
  };

  const handleContinue = () => {
    update({ draft: composeDraftText(editedDraft) });
    navigate("/review");
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <StepIndicator current="draft" />
      </div>

      <h1 className="text-[26px] font-semibold text-ink-900">
        Your application draft is ready.
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Review the draft carefully. You can edit any part before creating your
        case.
      </p>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={handleRegenerate} />
        </div>
      )}

      {regenerating ? (
        <div className="mt-6">
          <LoadingState message="Preparing your application..." />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <DraftEditor
            draft={editedDraft}
            onChange={handleDraftChange}
            requestType={analysis?.type}
            category={analysis?.category}
          />

          <aside className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-white p-5">
              <p className="text-[13px] font-medium text-ink-500">Based on</p>
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <p className="text-[12px] text-ink-500">Request type</p>
                  <Badge tone="accent" className="mt-1">
                    {analysis.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-[12px] text-ink-500">Category</p>
                  <p className="mt-1 text-[14px] text-ink-900">{analysis.category}</p>
                </div>
              </div>
            </div>

            {sources && sources.length > 0 && (
              <div className="rounded-lg border border-line bg-white p-5">
                <p className="text-[13px] font-medium text-ink-500">
                  Official guidance used
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {sources.map((src, i) => (
                    <SourceCard key={i} {...src} />
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-ink-300">
                  These references informed the draft's structure. They do not
                  confirm or approve your complaint.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={handleBack}>
          Back
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Regenerate Draft
          </Button>
          <Button onClick={handleContinue}>Continue to Review</Button>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        title="Regenerate this draft?"
        message="Your current edits will be replaced."
        confirmLabel="Regenerate"
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageContainer>
  );
}
