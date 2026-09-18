import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, Mic } from "lucide-react";
import PageContainer from "../components/PageContainer.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import Textarea from "../components/Textarea.jsx";
import Button from "../components/Button.jsx";
import ErrorState from "../components/ErrorState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useRequest } from "../context/RequestContext.jsx";
import { analyzeRequest, ApiError } from "../api/client.js";

const MAX_LENGTH = 2000;

export default function Start() {
  const { originalText, update } = useRequest();
  const [text, setText] = useState(originalText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleContinue = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (originalText === trimmed && analysis) {
      navigate("/analyze");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRequest(trimmed);
      update({
        originalText: trimmed,
        analysis: result,
        facts: null,
        missingInfo: null,
        draft: null,
      });
      navigate("/analyze");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to connect to the drafting service.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer narrow>
      <div className="mb-8">
        <StepIndicator current="describe" />
      </div>

      <h1 className="text-[26px] font-semibold text-ink-900">
        What would you like to report or ask?
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">
        Describe the issue in your own words. You do not need to know the formal
        terminology.
      </p>

      <div className="mt-6">
        <Textarea
          label="Describe your issue"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Example: There are large potholes on the road near my area. They have been there for three months and I want the road repaired."
          rows={8}
          maxLength={MAX_LENGTH}
          showCount
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-[14px] text-ink-300"
          title="Coming soon"
        >
          <Paperclip size={14} />
          Upload evidence
          <span className="text-[11px] text-ink-300">Coming soon</span>
        </button>
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-[14px] text-ink-300"
          title="Coming soon"
        >
          <Mic size={14} />
          Voice input
          <span className="text-[11px] text-ink-300">Coming soon</span>
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} onRetry={handleContinue} />
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <LoadingState message="Understanding your request..." />
        </div>
      )}

      {!loading && (
        <div className="mt-8 flex items-center justify-between">
          <p className="max-w-[320px] text-[13px] text-ink-500">
            Your draft is created from the information you provide. Review it
            before creating a case.
          </p>
          <Button onClick={handleContinue} disabled={!text.trim()}>
            Continue
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
