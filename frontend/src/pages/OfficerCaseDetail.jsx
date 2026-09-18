import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import PageContainer from "../components/PageContainer.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import LoadingState from "../components/LoadingState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { getCase, updateCaseStatus, ApiError } from "../api/client.js";

const STATUS_STAGES = [
  { id: "DRAFT", label: "Draft", desc: "Case created but not yet approved." },
  { id: "APPROVED", label: "Approved", desc: "Officer has approved the case for the next stage." },
  { id: "SUBMITTED", label: "Submitted", desc: "Case has been marked as submitted in the system." },
  { id: "UNDER_REVIEW", label: "Under Review", desc: "Case is being reviewed by competent authority." },
  { id: "ACTION_IN_PROGRESS", label: "Action in Progress", desc: "Action related to the case is in progress." },
  { id: "RESOLVED", label: "Resolved", desc: "Case has been marked resolved." },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

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

function getStatusBadgeTone(status) {
  switch (status?.toUpperCase()) {
    case "RESOLVED":
      return "success";
    case "UNDER_REVIEW":
    case "ACTION_IN_PROGRESS":
      return "accent";
    case "APPROVED":
      return "accent";
    case "SUBMITTED":
    case "DRAFT":
    default:
      return "default";
  }
}

export default function OfficerCaseDetail() {
  const { caseNumber } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  // Toggles for long sections
  const [showApplication, setShowApplication] = useState(true);

  const fetchCaseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCase(caseNumber);
      setRecord(data);
      setSelectedStatus(data.status || "DRAFT");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "Case not found. Please check the case number."
          : "Unable to load case details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseNumber) {
      fetchCaseDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseNumber]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === record?.status) return;
    setUpdating(true);
    setSuccessMessage(null);
    setUpdateError(null);

    try {
      const result = await updateCaseStatus(caseNumber, selectedStatus);

      // Verify that status update succeeded by re-fetching fresh case state
      const refreshed = await getCase(caseNumber);
      setRecord(refreshed);
      setSelectedStatus(refreshed.status || selectedStatus);
      setSuccessMessage("Case status updated successfully.");

      // Auto-hide success alert after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err) {
      setUpdateError(
        err instanceof ApiError ? err.message : "Failed to update case status."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageContainer narrow>
        <div className="py-12">
          <LoadingState message="Loading case details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !record) {
    return (
      <PageContainer narrow>
        <div className="py-8">
          <ErrorState message={error || "Case not found."} onRetry={fetchCaseDetails} />
          <div className="mt-4 text-center">
            <Link to="/officer" className="text-[14px] font-medium text-accent hover:underline">
              &larr; Back to Officer Dashboard
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const facts = record.extracted_facts || {};
  const currentStatus = record.status || "DRAFT";
  const currentStageIndex = STATUS_STAGES.findIndex(
    (s) => s.id === currentStatus.toUpperCase()
  );

  return (
    <PageContainer>
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-500 hover:text-ink-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to Cases</span>
        </Link>

        <span className="rounded-full border border-line bg-white px-3 py-1 text-[11px] font-medium text-ink-500">
          Officer Dashboard — Demo
        </span>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success-light px-4 py-3 text-[14px] text-success">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Update Error Notification */}
      {updateError && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[14px] text-danger">
          <AlertCircle size={18} className="shrink-0" />
          <span>{updateError}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left / Main Column: Case Details, Request, Facts, Application */}
        <div className="flex flex-col gap-6">
          {/* Case Overview Card */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-wider text-ink-500">
                  Case Details
                </p>
                <h1 className="mt-1 text-[24px] font-bold text-ink-900">
                  {record.case_number}
                </h1>
              </div>
              <Badge tone={getStatusBadgeTone(currentStatus)}>
                {currentStatus}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[12px] text-ink-500">Request Type</p>
                <p className="mt-1 text-[14px] font-semibold text-ink-900">
                  {record.request_type || "—"}
                </p>
              </div>

              <div>
                <p className="text-[12px] text-ink-500">Category</p>
                <p className="mt-1 text-[14px] font-semibold text-ink-900">
                  {record.category || "General"}
                </p>
              </div>

              <div>
                <p className="text-[12px] text-ink-500">Created</p>
                <p className="mt-1 text-[14px] font-semibold text-ink-900">
                  {formatDate(record.created_at)}
                </p>
              </div>
            </div>
          </Card>

          {/* Original Citizen Request */}
          <Card>
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <FileText size={16} className="text-ink-400" />
              <h2 className="text-[15px] font-semibold text-ink-900">
                Original citizen request
              </h2>
            </div>
            <div className="mt-3 rounded-md bg-paper p-4 text-[14px] leading-relaxed text-ink-800 whitespace-pre-wrap font-normal">
              {record.original_request || "No original text available."}
            </div>
          </Card>

          {/* Extracted Facts */}
          <Card>
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ShieldCheck size={16} className="text-accent" />
              <h2 className="text-[15px] font-semibold text-ink-900">
                Extracted facts
              </h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Issue
                </p>
                <p className="mt-1 text-[14px] font-medium text-ink-900">
                  {facts.issue || "—"}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Location
                </p>
                <p className="mt-1 text-[14px] text-ink-800">
                  {facts.location || "—"}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Duration
                </p>
                <p className="mt-1 text-[14px] text-ink-800">
                  {facts.duration || "—"}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Previous complaint
                </p>
                <p className="mt-1 text-[14px] text-ink-800">
                  {facts.previous_complaint === true
                    ? "Yes"
                    : facts.previous_complaint === false
                    ? "No"
                    : "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Previous complaint authority
                </p>
                <p className="mt-1 text-[14px] text-ink-800">
                  {facts.previous_complaint_authority || "—"}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Previous complaint date
                </p>
                <p className="mt-1 text-[14px] text-ink-800">
                  {formatDate(facts.previous_complaint_date)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                  Requested action / information
                </p>
                <p className="mt-1 text-[14px] font-medium text-ink-900">
                  {facts.requested_action || facts.requested_information || "—"}
                </p>
              </div>

              {facts.problem_details && facts.problem_details.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
                    Problem details
                  </p>
                  <ul className="mt-1 list-disc pl-5 text-[14px] text-ink-800">
                    {facts.problem_details.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Generated Application Draft */}
          <Card>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h2 className="text-[15px] font-semibold text-ink-900">
                  Generated application draft
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowApplication((v) => !v)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
              >
                <span>{showApplication ? "Collapse" : "Expand"}</span>
                {showApplication ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showApplication && (
              <div className="mt-4 rounded-md border border-line/60 bg-white p-6 shadow-2xs">
                <pre
                  className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-900 font-sans"
                  style={{ fontFamily: "inherit" }}
                >
                  {cleanMarkdown(record.draft || "No draft text generated.")}
                </pre>
              </div>
            )}
          </Card>

          {/* Bottom Actions */}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-4">
            <Link to="/officer">
              <Button variant="secondary">Back to Cases</Button>
            </Link>

            <Button
              onClick={handleStatusUpdate}
              disabled={updating || selectedStatus === currentStatus}
            >
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>

        {/* Right Sidebar: Status Management & Case Progress Timeline */}
        <div className="flex flex-col gap-6">
          {/* Status Management Panel */}
          <Card className="border-accent/30 bg-accent-light/10">
            <h2 className="text-[15px] font-semibold text-ink-900">
              Update case status
            </h2>
            <p className="mt-1 text-[12px] text-ink-500">
              Manage the formal lifecycle state of this case.
            </p>

            <div className="mt-4">
              <label htmlFor="select-status" className="block text-[12px] font-medium text-ink-700">
                Current status: <span className="font-semibold text-ink-900">{currentStatus}</span>
              </label>

              <select
                id="select-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mt-2 w-full rounded-md border border-line bg-white p-2.5 text-[14px] font-medium text-ink-900 shadow-xs outline-none focus:border-accent"
              >
                {STATUS_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 rounded border border-line/80 bg-white p-3 text-[11px] leading-relaxed text-ink-500">
              <p className="font-semibold text-ink-700">System Workflow Notice</p>
              <p className="mt-1">
                The system currently does not integrate with an external government submission API.
                SUBMITTED represents an internal state in The Grievance Scribe workflow.
              </p>
            </div>

            <div className="mt-5">
              <Button
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === currentStatus}
              >
                {updating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Status...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </Card>

          {/* Case Progress Timeline */}
          <Card>
            <h3 className="text-[14px] font-semibold text-ink-900">Case Progress</h3>
            <p className="mt-0.5 text-[12px] text-ink-500">
              Progress through the official handling stages.
            </p>

            <ol className="mt-5 flex flex-col gap-0">
              {STATUS_STAGES.map((stage, index) => {
                const isCompleted = currentStageIndex >= 0 && index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isLast = index === STATUS_STAGES.length - 1;

                return (
                  <li key={stage.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[9px] top-4 h-full w-px ${
                          isCompleted ? "bg-accent" : "bg-line"
                        }`}
                      />
                    )}

                    <span
                      className={`relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCurrent
                          ? "border-2 border-accent bg-accent text-white"
                          : isCompleted
                          ? "border-2 border-accent bg-accent text-white"
                          : "border-2 border-line bg-white text-ink-300"
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? "✓" : isCurrent ? "●" : "○"}
                    </span>

                    <div>
                      <p
                        className={`text-[13px] font-medium leading-tight ${
                          isCurrent
                            ? "text-ink-900 font-semibold"
                            : isCompleted
                            ? "text-ink-800 font-medium"
                            : "text-ink-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <p className="mt-0.5 text-[11px] font-medium text-accent">
                          Current status
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {stage.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
