import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { useRequest } from "./context/RequestContext.jsx";

import Home from "./pages/Home.jsx";
import Start from "./pages/Start.jsx";
import Analyze from "./pages/Analyze.jsx";
import Details from "./pages/Details.jsx";
import Draft from "./pages/Draft.jsx";
import Review from "./pages/Review.jsx";
import CaseCreated from "./pages/CaseCreated.jsx";
import Cases from "./pages/Cases.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import OfficerDashboard from "./pages/OfficerDashboard.jsx";
import OfficerCaseDetail from "./pages/OfficerCaseDetail.jsx";

function RequireStart({ children }) {
  const { originalText } = useRequest();
  if (!originalText) return <Navigate to="/start" replace />;
  return children;
}

function RequireAnalysis({ children }) {
  const { originalText, analysis } = useRequest();
  if (!originalText) return <Navigate to="/start" replace />;
  if (!analysis?.type) return <Navigate to="/analyze" replace />;
  return children;
}

function RequireFacts({ children }) {
  const { originalText, analysis, facts } = useRequest();
  if (!originalText) return <Navigate to="/start" replace />;
  if (!analysis?.type) return <Navigate to="/analyze" replace />;
  if (!facts) return <Navigate to="/details" replace />;
  return children;
}

function RequireDraft({ children }) {
  const { originalText, analysis, facts, draft } = useRequest();
  if (!originalText) return <Navigate to="/start" replace />;
  if (!analysis?.type) return <Navigate to="/analyze" replace />;
  if (!facts) return <Navigate to="/details" replace />;
  if (!draft) return <Navigate to="/draft" replace />;
  return children;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-900">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<Start />} />
          <Route
            path="/analyze"
            element={
              <RequireStart>
                <Analyze />
              </RequireStart>
            }
          />
          <Route
            path="/details"
            element={
              <RequireAnalysis>
                <Details />
              </RequireAnalysis>
            }
          />
          <Route
            path="/draft"
            element={
              <RequireFacts>
                <Draft />
              </RequireFacts>
            }
          />
          <Route
            path="/review"
            element={
              <RequireDraft>
                <Review />
              </RequireDraft>
            }
          />
          <Route path="/case/:caseNumber" element={<CaseCreated />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/officer/cases/:caseNumber" element={<OfficerCaseDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="border-t border-line py-4 text-center text-[12px] text-ink-400">
        <span>The Grievance Scribe</span> &middot;{" "}
        <Link to="/officer" className="hover:text-ink-700 hover:underline">
          Officer access
        </Link>
      </footer>
    </div>
  );
}
