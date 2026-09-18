import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "grievance-scribe:request";
const CASES_KEY = "grievance-scribe:case-numbers";

const RequestContext = createContext(null);

const initialState = {
  originalText: "",
  analysis: null, // { type, category, reason, requested_action_or_information }
  facts: null,
  missingInfo: null, // { missing, questions }
  draft: null, // { subject, to, body, closing }
  sources: [],
  caseRecord: null,
  applicant: {
    fullName: "",
    address: "",
    phone: "",
    email: "",
  },
  get applicantDetails() {
    return this.applicant;
  },
  get case() {
    return this.caseRecord;
  },
};

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    const applicant =
      parsed.applicant || parsed.applicantDetails || initialState.applicant;
    const caseRecord =
      parsed.caseRecord || parsed.case || initialState.caseRecord;
    return { ...initialState, ...parsed, applicant, caseRecord };
  } catch {
    return initialState;
  }
}

export function RequestProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage unavailable; progress simply won't persist across refresh
    }
  }, [state]);

  const update = (patch) =>
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.applicant) next.applicantDetails = patch.applicant;
      if (patch.applicantDetails) next.applicant = patch.applicantDetails;
      if (patch.case) next.caseRecord = patch.case;
      if (patch.caseRecord) next.case = patch.caseRecord;
      return next;
    });

  const reset = () => {
    setState(initialState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const rememberCaseNumber = (caseNumber) => {
    try {
      const existing = JSON.parse(localStorage.getItem(CASES_KEY) || "[]");
      const next = [caseNumber, ...existing.filter((c) => c !== caseNumber)];
      localStorage.setItem(CASES_KEY, JSON.stringify(next.slice(0, 50)));
    } catch {
      /* ignore */
    }
  };

  const getRememberedCaseNumbers = () => {
    try {
      return JSON.parse(localStorage.getItem(CASES_KEY) || "[]");
    } catch {
      return [];
    }
  };

  return (
    <RequestContext.Provider
      value={{
        ...state,
        applicant: state.applicant || state.applicantDetails,
        applicantDetails: state.applicant || state.applicantDetails,
        case: state.case || state.caseRecord,
        caseRecord: state.case || state.caseRecord,
        update,
        reset,
        rememberCaseNumber,
        getRememberedCaseNumbers,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const ctx = useContext(RequestContext);
  if (!ctx) {
    throw new Error("useRequest must be used within a RequestProvider");
  }
  return ctx;
}
