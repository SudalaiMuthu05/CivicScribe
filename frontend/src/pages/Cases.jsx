import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Inbox } from "lucide-react";
import PageContainer from "../components/PageContainer.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useRequest } from "../context/RequestContext.jsx";
import { getCase } from "../api/client.js";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function Cases() {
  const { getRememberedCaseNumbers } = useRequest();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackInput, setTrackInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const numbers = getRememberedCaseNumbers();
    if (numbers.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      numbers.map((num) =>
        getCase(num)
          .then((data) => data)
          .catch(() => null)
      )
    ).then((results) => {
      setRows(results.filter(Boolean));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackInput.trim()) navigate(`/case/${trackInput.trim()}`);
  };

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[26px] font-semibold text-ink-900">My Cases</h1>
        <form onSubmit={handleTrack} className="flex items-end gap-2">
          <Input
            label="Track a case"
            placeholder="GS-XXXXXXXX"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="mb-0">
            <Search size={14} />
          </Button>
        </form>
      </div>

      <p className="mt-2 text-[13px] text-ink-500">
        Recent cases on this device. This list is stored locally in your
        browser and is not a signed-in account history.
      </p>

      {loading ? (
        <div className="mt-6">
          <LoadingState message="Loading your cases..." />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="No cases created on this device yet"
            description="Cases you create will appear here for quick access."
            action={
              <Link to="/start">
                <Button>Start a Request</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line text-[13px] text-ink-500">
                <th className="px-4 py-3 font-medium">Case Number</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.case_number} className="border-b border-line text-[14px] last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {row.case_number}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{row.request_type}</td>
                  <td className="px-4 py-3 text-ink-700">{row.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone="accent">{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/case/${row.case_number}`}
                      className="font-medium text-accent hover:text-accent-dark"
                    >
                      View Case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
