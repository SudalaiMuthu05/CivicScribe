/**
 * The Grievance Scribe - Vanilla Client Application
 * Handles civic workflow navigation, API integration, draft review, and case tracking.
 */

(function () {
  "use strict";

  // Determine API base dynamically
  const isLocalBackend = window.location.origin.includes(":8000");
  const API_BASE = isLocalBackend ? "/api" : "http://127.0.0.1:8000/api";

  // Central Application State
  const state = {
    step: "describe",
    originalText: "",
    analysis: null,
    facts: {},
    missingQuestions: [],
    clarifications: {},
    draft: "",
    parsedDraft: { to: "", subject: "", body: "", closing: "" },
    draftMode: "document", // 'document' | 'edit'
    sources: [],
    applicant: { fullName: "", address: "", phone: "", email: "" },
    confirmed: false,
    caseRecord: null,
    savedCases: [],
    officerCases: [],
    officerCurrentCase: null,
    officerSearchQuery: "",
    officerStatusFilter: "ALL",
    officerTypeFilter: "ALL",
  };

  // Sample quick prompt descriptions
  const SAMPLES = {
    "street-light":
      "The street lights on 3rd Main Road, Perambur, Chennai have been broken for 2 months. The bulb and wiring are damaged, causing safety hazards at night. Despite lodging a complaint with the Chennai Corporation Zonal Office two weeks ago, no repair work has been carried out. I request urgent replacement and restoration of the lights.",
    "road-repair-rti":
      "Under the Right to Information Act 2005, I request certified copies of the tender documents, sanctioned budget, expenditure statements, and contractor work completion reports for the road repair work carried out on Anna Nagar 2nd Avenue between January 2026 and June 2026.",
    "garbage-dump":
      "Garbage and plastic waste have been accumulating on 4th Cross Street, Gandhi Nagar for over three weeks without regular municipal clearance. The overflow is creating severe health hazards and foul odor. I request regular waste collection and sanitization of the spot immediately.",
  };

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

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

  function getFormattedCurrentDate() {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function replaceDatePlaceholders(text) {
    if (!text) return "";
    const today = getFormattedCurrentDate();
    return text.replace(/\[(?:today's\s+|current\s+)?date\]/gi, today);
  }

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
          if (toMatch[1].trim()) toLines.push(toMatch[1].trim());
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

  function composeDraftText(parsed) {
    const parts = [];
    const cleanTo = (parsed.to || "").trim().replace(/^to\s*[:,-]?\s*/i, "");
    if (cleanTo) parts.push(`To:\n${cleanTo}`);
    if (parsed.subject && parsed.subject.trim()) {
      parts.push(`\nSubject: ${parsed.subject.trim()}`);
    }
    parts.push("");
    if (parsed.body && parsed.body.trim()) {
      parts.push(parsed.body.trim());
    }
    if (parsed.closing && parsed.closing.trim()) {
      parts.push("");
      parts.push(parsed.closing.trim());
    }
    return cleanMarkdown(parts.join("\n").trim());
  }

  function replaceApplicantPlaceholders(draftText, applicant) {
    if (!draftText) return "";
    let text = draftText;
    const name = applicant.fullName?.trim() || "[Name]";
    const address = applicant.address?.trim() || "[Address]";
    const phone = applicant.phone?.trim() || "[Contact Number]";

    text = text.replace(/\[(?:Your\s+)?Name\]/gi, name);
    text = text.replace(/\[(?:Your\s+)?Address\]/gi, address);
    text = text.replace(/\[(?:Your\s+)?(?:Phone|Contact)(?:\s+Number)?\]/gi, phone);
    return text;
  }

  // ---------------------------------------------------------------------------
  // API Calls
  // ---------------------------------------------------------------------------

  async function apiPost(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let errText = `API error ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.detail || errJson.message || errText;
      } catch (_) {}
      throw new Error(errText);
    }
    return res.json();
  }

  async function apiGet(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      let errText = `API error ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.detail || errJson.message || errText;
      } catch (_) {}
      throw new Error(errText);
    }
    return res.json();
  }

  async function apiPatch(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let errText = `API error ${res.status}`;
      try {
        const errJson = await res.json();
        errText = errJson.detail || errJson.message || errText;
      } catch (_) {}
      throw new Error(errText);
    }
    return res.json();
  }

  // ---------------------------------------------------------------------------
  // UI State & Navigation
  // ---------------------------------------------------------------------------

  function showLoading(message) {
    const el = document.getElementById("global-loading");
    const txt = document.getElementById("global-loading-text");
    if (el && txt) {
      txt.textContent = message || "Processing...";
      el.style.display = "flex";
    }
  }

  function hideLoading() {
    const el = document.getElementById("global-loading");
    if (el) el.style.display = "none";
  }

  function showError(message) {
    const el = document.getElementById("global-error");
    const txt = document.getElementById("global-error-text");
    if (el && txt) {
      txt.textContent = message;
      el.style.display = "flex";
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function hideError() {
    const el = document.getElementById("global-error");
    if (el) el.style.display = "none";
  }

  const STEPS_ORDER = ["describe", "understand", "details", "draft", "review", "created"];

  function updateStepper(currentStep) {
    const stepperContainer = document.getElementById("stepper-container");
    if (!STEPS_ORDER.includes(currentStep)) {
      if (stepperContainer) stepperContainer.style.display = "none";
      return;
    }
    if (stepperContainer) stepperContainer.style.display = "block";

    const currentIndex = STEPS_ORDER.indexOf(currentStep);
    STEPS_ORDER.forEach((stepName, idx) => {
      const el = document.getElementById(`step-nav-${stepName}`);
      if (!el) return;
      el.classList.remove("active", "completed");
      if (idx === currentIndex) {
        el.classList.add("active");
      } else if (idx < currentIndex) {
        el.classList.add("completed");
      }
    });
  }

  function goToStep(stepName) {
    hideError();
    state.step = stepName;

    // Hide all view sections
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.style.display = "none";
    });

    // Show target section
    const targetSection = document.getElementById(`view-${stepName}`);
    if (targetSection) {
      targetSection.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update active nav links
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
    if (stepName === "describe") {
      document.getElementById("nav-new-request")?.classList.add("active");
    } else if (stepName === "cases") {
      document.getElementById("nav-cases")?.classList.add("active");
    } else if (stepName === "how-it-works") {
      document.getElementById("nav-how-it-works")?.classList.add("active");
    }

    updateStepper(stepName);

    // Trigger step-specific renders
    if (stepName === "understand") renderUnderstand();
    if (stepName === "details") renderDetails();
    if (stepName === "draft") renderDraft();
    if (stepName === "review") renderReview();
    if (stepName === "created") renderCreated();
    if (stepName === "cases") renderCasesTable();
    if (stepName === "officer") renderOfficerDashboard();
    if (stepName === "officer-detail") renderOfficerCaseDetail();
  }

  // ---------------------------------------------------------------------------
  // Step Renderers
  // ---------------------------------------------------------------------------

  // STEP 2: UNDERSTAND
  function renderUnderstand() {
    if (!state.analysis) return;
    const typeBadge = document.getElementById("badge-request-type");
    const categoryText = document.getElementById("text-category");
    const reasonText = document.getElementById("text-reason");
    const actionText = document.getElementById("text-requested-action");

    if (typeBadge) typeBadge.textContent = state.analysis.type || "GRIEVANCE";
    if (categoryText) categoryText.textContent = state.analysis.category || "General";
    if (reasonText) reasonText.textContent = state.analysis.reason || "Citizen request classified based on provided statements.";
    if (actionText) actionText.textContent = state.analysis.requested_action_or_information || "Not specified";
  }

  // STEP 3: DETAILS
  async function renderDetails() {
    const badgeType = document.getElementById("details-badge-type");
    const catText = document.getElementById("details-category-text");
    if (badgeType) badgeType.textContent = state.analysis?.type || "GRIEVANCE";
    if (catText) catText.textContent = state.analysis?.category || "General";

    // Populate structured facts
    const facts = state.facts || {};
    document.getElementById("fact-issue").value = facts.issue || "";
    document.getElementById("fact-location").value = facts.location || "";
    document.getElementById("fact-duration").value = facts.duration || "";

    const prevCompSelect = document.getElementById("fact-prev-complaint");
    if (prevCompSelect) {
      if (facts.previous_complaint === true) prevCompSelect.value = "true";
      else if (facts.previous_complaint === false) prevCompSelect.value = "false";
      else prevCompSelect.value = "null";
    }

    document.getElementById("fact-prev-authority").value = facts.previous_complaint_authority || "";
    document.getElementById("fact-prev-date").value = facts.previous_complaint_date || "";

    const reqField = document.getElementById("fact-requested-action");
    if (reqField) {
      reqField.value = facts.requested_action || facts.requested_information || "";
    }

    // Call dynamic missing info API
    await fetchMissingInformation();
  }

  async function fetchMissingInformation() {
    const container = document.getElementById("missing-questions-container");
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 0; color: var(--ink-500); font-size: 0.88rem;">
        <div class="spinner" style="width: 1.2rem; height: 1.2rem; border-width: 2px; margin: 0;"></div>
        <span>Checking whether any important details are missing...</span>
      </div>
    `;

    try {
      const res = await apiPost("/missing-info", {
        request_type: state.analysis?.type,
        category: state.analysis?.category,
        facts: state.facts,
      });

      const questions = res.questions || [];
      state.missingQuestions = questions;

      if (questions.length === 0) {
        container.innerHTML = `
          <div class="alert alert-success" style="margin-bottom: 0;">
            <span>Your information is sufficient to prepare a formal application.</span>
          </div>
        `;
      } else {
        container.innerHTML = questions
          .map((q, idx) => {
            const qText = typeof q === "string" ? q : q.question || "";
            const currentVal = state.clarifications[idx] || "";
            return `
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="missing-q-${idx}">${qText}</label>
                <input type="text" id="missing-q-${idx}" class="form-input missing-q-input" data-idx="${idx}" value="${currentVal}" placeholder="Provide details (optional)..." />
              </div>
            `;
          })
          .join("");

        // Attach listeners to input fields
        container.querySelectorAll(".missing-q-input").forEach((inp) => {
          inp.addEventListener("input", (e) => {
            const idx = e.target.getAttribute("data-idx");
            state.clarifications[idx] = e.target.value;
          });
        });
      }
    } catch (err) {
      container.innerHTML = `
        <div class="alert alert-danger" style="margin-bottom: 0;">
          <span>Could not check for additional details: ${err.message}</span>
        </div>
      `;
    }
  }

  // STEP 4: DRAFT
  function renderDraft() {
    if (!state.draft) return;
    state.parsedDraft = parseDraftText(state.draft);

    const isRti = state.analysis?.type?.toUpperCase() === "RTI";
    const docTitle = isRti
      ? "APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005"
      : "FORMAL PUBLIC GRIEVANCE PETITION";

    document.getElementById("doc-title-text").textContent = docTitle;
    document.getElementById("doc-category-text").textContent = `Department / Category: ${state.analysis?.category || "General"}`;
    document.getElementById("doc-date-text").textContent = `Date: ${getFormattedCurrentDate()}`;

    // Recipient
    const cleanTo = (state.parsedDraft.to || "").replace(/^to\s*[:,-]?\s*/i, "");
    document.getElementById("doc-to-text").textContent = cleanTo || "The Competent Authority";

    // Subject
    const subWrapper = document.getElementById("doc-subject-wrapper");
    if (state.parsedDraft.subject) {
      subWrapper.style.display = "block";
      document.getElementById("doc-subject-text").textContent = cleanMarkdown(state.parsedDraft.subject);
    } else {
      subWrapper.style.display = "none";
    }

    // Body
    const bodyContainer = document.getElementById("doc-body-text");
    bodyContainer.innerHTML = "";
    const paras = (state.parsedDraft.body || "").split("\n\n").filter((p) => p.trim());

    paras.forEach((para) => {
      const lines = para.split("\n");
      const block = document.createElement("div");
      block.style.marginBottom = "1rem";

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const item = document.createElement("div");
          item.className = "doc-bullet-item";
          item.innerHTML = `
            <span class="doc-bullet-dot"></span>
            <span>${cleanMarkdown(trimmed.replace(/^[\•\-]\s*/, ""))}</span>
          `;
          block.appendChild(item);
        } else if (trimmed) {
          const p = document.createElement("p");
          p.textContent = cleanMarkdown(trimmed);
          block.appendChild(p);
        }
      });
      bodyContainer.appendChild(block);
    });

    // Closing
    document.getElementById("doc-closing-text").textContent = state.parsedDraft.closing;

    // Populate Edit Section Inputs
    document.getElementById("edit-to").value = cleanTo;
    document.getElementById("edit-subject").value = state.parsedDraft.subject || "";
    document.getElementById("edit-body").value = state.parsedDraft.body || "";
    document.getElementById("edit-closing").value = state.parsedDraft.closing || "";

    // Sources accordion
    const sourcesAcc = document.getElementById("sources-accordion");
    if (state.sources && state.sources.length > 0) {
      sourcesAcc.style.display = "block";
      document.getElementById("sources-count").textContent = state.sources.length;
      const list = document.getElementById("sources-list");
      list.innerHTML = state.sources
        .map(
          (s) => `
          <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle);">
            <strong style="font-size: 0.88rem; color: var(--ink-900);">${s.title || "Government Standard"}</strong>
            <p style="font-size: 0.8rem; color: var(--ink-500); margin-top: 0.15rem;">Source: ${s.source || "Official portal"}</p>
          </div>
        `
        )
        .join("");
    } else {
      sourcesAcc.style.display = "none";
    }
  }

  // STEP 5: REVIEW
  function renderReview() {
    const previewEl = document.getElementById("review-preview-text");
    const badgeEl = document.getElementById("review-type-badge");
    if (badgeEl) badgeEl.textContent = state.analysis?.type || "GRIEVANCE";

    const updatePreview = () => {
      const displayDraft = replaceApplicantPlaceholders(state.draft, state.applicant);
      if (previewEl) previewEl.textContent = cleanMarkdown(displayDraft);

      const isValid =
        Boolean(state.applicant.fullName?.trim()) &&
        Boolean(state.applicant.address?.trim()) &&
        Boolean(state.applicant.phone?.trim()) &&
        state.confirmed;

      const submitBtn = document.getElementById("btn-submit-review");
      if (submitBtn) submitBtn.disabled = !isValid;
    };

    updatePreview();

    // Populate fields
    document.getElementById("applicant-name").value = state.applicant.fullName || "";
    document.getElementById("applicant-address").value = state.applicant.address || "";
    document.getElementById("applicant-phone").value = state.applicant.phone || "";
    document.getElementById("applicant-email").value = state.applicant.email || "";
    document.getElementById("check-confirm-review").checked = Boolean(state.confirmed);
  }

  // STEP 6: CREATED
  function renderCreated() {
    if (!state.caseRecord) return;
    const rec = state.caseRecord;

    document.getElementById("created-case-number").textContent = rec.case_number;
    document.getElementById("created-status-badge").textContent = rec.status || "DRAFT";
    document.getElementById("created-type").textContent = rec.request_type || "—";
    document.getElementById("created-category").textContent = rec.category || "—";

    // Accordions
    document.getElementById("acc-original-body").textContent = rec.original_request || state.originalText || "—";
    document.getElementById("acc-draft-body").textContent = cleanMarkdown(rec.draft || state.draft || "—");

    // Status Timeline
    const timelineItems = document.querySelectorAll("#created-timeline .timeline-item");
    const STAGES = ["DRAFT", "APPROVED", "SUBMITTED", "UNDER_REVIEW", "ACTION_IN_PROGRESS", "RESOLVED"];
    const currIdx = STAGES.indexOf((rec.status || "DRAFT").toUpperCase());

    timelineItems.forEach((item) => {
      const statusId = item.getAttribute("data-status");
      const idx = STAGES.indexOf(statusId);
      item.classList.remove("active", "completed");
      if (idx === currIdx) item.classList.add("active");
      else if (idx < currIdx) item.classList.add("completed");
    });
  }

  // VIEW: MY CASES
  function renderCasesTable() {
    loadSavedCases();
    const tableCard = document.getElementById("cases-table-card");
    const emptyState = document.getElementById("cases-empty-state");
    const tbody = document.getElementById("cases-table-body");

    if (!state.savedCases || state.savedCases.length === 0) {
      if (tableCard) tableCard.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (tableCard) tableCard.style.display = "block";
    if (emptyState) emptyState.style.display = "none";

    tbody.innerHTML = state.savedCases
      .map(
        (c) => `
        <tr>
          <td><strong style="color: var(--ink-900);">${c.case_number}</strong></td>
          <td>${c.request_type || "—"}</td>
          <td>${c.category || "—"}</td>
          <td><span class="badge badge-accent">${c.status || "DRAFT"}</span></td>
          <td>${c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB") : "—"}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm btn-view-saved-case" data-case="${c.case_number}">
              View Case
            </button>
          </td>
        </tr>
      `
      )
      .join("");

    tbody.querySelectorAll(".btn-view-saved-case").forEach((btn) => {
      btn.addEventListener("click", () => {
        const caseNum = btn.getAttribute("data-case");
        trackAndOpenCase(caseNum);
      });
    });
  }

  function saveCaseToStorage(record) {
    if (!record || !record.case_number) return;
    loadSavedCases();
    const existingIdx = state.savedCases.findIndex((c) => c.case_number === record.case_number);
    if (existingIdx >= 0) {
      state.savedCases[existingIdx] = record;
    } else {
      state.savedCases.unshift(record);
    }
    try {
      localStorage.setItem("gs_saved_cases", JSON.stringify(state.savedCases));
    } catch (_) {}
  }

  function loadSavedCases() {
    try {
      const raw = localStorage.getItem("gs_saved_cases");
      if (raw) state.savedCases = JSON.parse(raw);
    } catch (_) {
      state.savedCases = [];
    }
  }

  async function trackAndOpenCase(caseNum) {
    if (!caseNum) return;
    showLoading("Fetching case details...");
    try {
      const data = await apiGet(`/cases/${caseNum.trim()}`);
      state.caseRecord = data;
      saveCaseToStorage(data);
      goToStep("created");
    } catch (err) {
      showError(`Case not found: ${err.message}`);
    } finally {
      hideLoading();
    }
  }

  // ---------------------------------------------------------------------------
  // Officer Dashboard & Management
  // ---------------------------------------------------------------------------

  function renderStatusBadge(status) {
    const s = (status || "DRAFT").toUpperCase();
    if (s === "RESOLVED") {
      return `<span class="badge badge-success">RESOLVED</span>`;
    }
    if (s === "UNDER_REVIEW" || s === "ACTION_IN_PROGRESS") {
      return `<span class="badge badge-warning">${s.replace(/_/g, " ")}</span>`;
    }
    return `<span class="badge badge-accent">${s.replace(/_/g, " ")}</span>`;
  }

  async function renderOfficerDashboard(forceRefresh = false) {
    showLoading("Loading all cases...");
    try {
      if (forceRefresh || !state.officerCases || state.officerCases.length === 0) {
        const res = await apiGet("/cases");
        state.officerCases = res.cases || [];
      }
      updateOfficerMetrics();
      renderOfficerCasesRows();
    } catch (err) {
      showError(`Failed to load cases: ${err.message}`);
    } finally {
      hideLoading();
    }
  }

  function updateOfficerMetrics() {
    const cases = state.officerCases || [];
    const total = cases.length;
    const draft = cases.filter((c) => (c.status || "DRAFT").toUpperCase() === "DRAFT").length;
    const submitted = cases.filter((c) => (c.status || "").toUpperCase() === "SUBMITTED").length;
    const review = cases.filter((c) => {
      const s = (c.status || "").toUpperCase();
      return s === "UNDER_REVIEW" || s === "ACTION_IN_PROGRESS" || s === "APPROVED";
    }).length;
    const resolved = cases.filter((c) => (c.status || "").toUpperCase() === "RESOLVED").length;

    const elTotal = document.getElementById("stat-total-cases");
    const elDraft = document.getElementById("stat-draft-cases");
    const elSubmitted = document.getElementById("stat-submitted-cases");
    const elReview = document.getElementById("stat-review-cases");
    const elResolved = document.getElementById("stat-resolved-cases");

    if (elTotal) elTotal.textContent = total;
    if (elDraft) elDraft.textContent = draft;
    if (elSubmitted) elSubmitted.textContent = submitted;
    if (elReview) elReview.textContent = review;
    if (elResolved) elResolved.textContent = resolved;
  }

  function renderOfficerCasesRows() {
    const tbody = document.getElementById("officer-cases-tbody");
    const emptyState = document.getElementById("officer-empty-state");
    if (!tbody) return;

    let filtered = (state.officerCases || []).slice();

    if (state.officerSearchQuery) {
      const q = state.officerSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.case_number || "").toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q) ||
          (c.request_type || "").toLowerCase().includes(q) ||
          (c.original_request || "").toLowerCase().includes(q)
      );
    }

    if (state.officerStatusFilter && state.officerStatusFilter !== "ALL") {
      filtered = filtered.filter(
        (c) => (c.status || "DRAFT").toUpperCase() === state.officerStatusFilter
      );
    }

    if (state.officerTypeFilter && state.officerTypeFilter !== "ALL") {
      filtered = filtered.filter(
        (c) => (c.request_type || "").toUpperCase() === state.officerTypeFilter
      );
    }

    if (!state.officerCases || state.officerCases.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--ink-500); padding: 2.5rem 1rem;">
            No matching cases found for the selected criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map(
        (c) => `
        <tr>
          <td><strong style="color: var(--ink-900); font-family: monospace; font-size: 0.9rem;">${c.case_number}</strong></td>
          <td><span class="badge" style="background: var(--bg-subtle); border: 1px solid var(--border-line);">${c.request_type || "—"}</span></td>
          <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.category || "—"}</td>
          <td>${renderStatusBadge(c.status)}</td>
          <td>${c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB") : "—"}</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm btn-view-officer-case" data-case="${c.case_number}">
              View Case
            </button>
          </td>
        </tr>
      `
      )
      .join("");

    tbody.querySelectorAll(".btn-view-officer-case").forEach((btn) => {
      btn.addEventListener("click", () => {
        const caseNum = btn.getAttribute("data-case");
        openOfficerCaseDetail(caseNum);
      });
    });
  }

  async function openOfficerCaseDetail(caseNumber) {
    if (!caseNumber) return;
    showLoading("Loading case details...");
    try {
      const data = await apiGet(`/cases/${caseNumber.trim()}`);
      state.officerCurrentCase = data;
      goToStep("officer-detail");
    } catch (err) {
      showError(`Case lookup failed: ${err.message}`);
    } finally {
      hideLoading();
    }
  }

  function renderOfficerCaseDetail() {
    if (!state.officerCurrentCase) return;
    const c = state.officerCurrentCase;

    const numEl = document.getElementById("officer-case-num-text");
    const statusBadge = document.getElementById("officer-case-status-badge");
    const typeText = document.getElementById("officer-case-type-text");
    const catText = document.getElementById("officer-case-cat-text");
    const createdText = document.getElementById("officer-case-created-text");
    const currStatusDisp = document.getElementById("officer-current-status-display");
    const statusSelect = document.getElementById("select-officer-status");
    const origReqEl = document.getElementById("officer-orig-req-text");
    const factsContainer = document.getElementById("officer-facts-container");
    const draftPre = document.getElementById("officer-draft-text");
    const successAlert = document.getElementById("officer-status-success");

    if (successAlert) successAlert.style.display = "none";
    if (numEl) numEl.textContent = c.case_number;
    if (statusBadge) {
      statusBadge.textContent = c.status || "DRAFT";
      statusBadge.className = "badge";
      const sUpper = (c.status || "").toUpperCase();
      if (sUpper === "RESOLVED") {
        statusBadge.classList.add("badge-success");
      } else if (sUpper === "UNDER_REVIEW" || sUpper === "ACTION_IN_PROGRESS") {
        statusBadge.classList.add("badge-warning");
      } else {
        statusBadge.classList.add("badge-accent");
      }
    }
    if (typeText) typeText.textContent = c.request_type || "—";
    if (catText) catText.textContent = c.category || "—";
    if (createdText) {
      createdText.textContent = c.created_at
        ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";
    }
    if (currStatusDisp) currStatusDisp.textContent = c.status || "DRAFT";
    if (statusSelect) statusSelect.value = c.status || "DRAFT";

    // Update officer timeline
    const timelineItems = document.querySelectorAll("#officer-timeline .timeline-item");
    const STAGES = ["DRAFT", "APPROVED", "SUBMITTED", "UNDER_REVIEW", "ACTION_IN_PROGRESS", "RESOLVED"];
    const currIdx = STAGES.indexOf((c.status || "DRAFT").toUpperCase());

    timelineItems.forEach((item) => {
      const statusId = item.getAttribute("data-status");
      const idx = STAGES.indexOf(statusId);
      item.classList.remove("active", "completed");
      if (idx === currIdx) item.classList.add("active");
      else if (idx >= 0 && idx < currIdx) item.classList.add("completed");
    });

    // Original request
    if (origReqEl) {
      origReqEl.textContent = c.original_request || "—";
    }

    // Extracted facts
    if (factsContainer) {
      const facts = c.extracted_facts || {};
      const keys = Object.keys(facts).filter((k) => facts[k] !== null && facts[k] !== undefined && facts[k] !== "");
      if (keys.length === 0) {
        factsContainer.innerHTML = `<p style="font-size: 0.88rem; color: var(--ink-500);">No facts extracted for this case.</p>`;
      } else {
        factsContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem;">
            ${keys
              .map((k) => {
                const label = k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                let val = facts[k];
                if (typeof val === "boolean") val = val ? "Yes" : "No";
                else if (typeof val === "object") val = JSON.stringify(val);
                return `
                  <div style="background: var(--bg-subtle); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-line);">
                    <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--ink-500); font-weight: 600; display: block; margin-bottom: 0.2rem;">${label}</span>
                    <span style="font-size: 0.88rem; color: var(--ink-900); font-weight: 500;">${val}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      }
    }

    // Application Draft
    if (draftPre) {
      draftPre.textContent = cleanMarkdown(c.draft || "—");
    }
  }

  // ---------------------------------------------------------------------------
  // Event Listeners & Flow Setup
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    loadSavedCases();

    // 1. Navigation & Brand
    document.getElementById("nav-brand")?.addEventListener("click", (e) => {
      e.preventDefault();
      goToStep("describe");
    });
    document.getElementById("nav-new-request")?.addEventListener("click", (e) => {
      e.preventDefault();
      goToStep("describe");
    });
    document.getElementById("nav-cases")?.addEventListener("click", (e) => {
      e.preventDefault();
      goToStep("cases");
    });
    document.getElementById("nav-how-it-works")?.addEventListener("click", (e) => {
      e.preventDefault();
      goToStep("how-it-works");
    });
    document.getElementById("btn-cases-start")?.addEventListener("click", () => goToStep("describe"));
    document.getElementById("btn-how-start")?.addEventListener("click", () => goToStep("describe"));

    // 2. Sample Chips
    document.querySelectorAll(".chip-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sampleKey = btn.getAttribute("data-sample");
        if (SAMPLES[sampleKey]) {
          document.getElementById("input-request-text").value = SAMPLES[sampleKey];
        }
      });
    });

    // 3. Step 1 -> Analyze
    document.getElementById("btn-submit-describe")?.addEventListener("click", async () => {
      const text = document.getElementById("input-request-text").value.trim();
      if (!text) {
        showError("Please enter a description of your issue or information request.");
        return;
      }
      state.originalText = text;
      hideError();
      showLoading("Understanding your request...");

      try {
        const res = await apiPost("/analyze", { text });
        state.analysis = res;
        goToStep("understand");
      } catch (err) {
        showError(`Analysis failed: ${err.message}`);
      } finally {
        hideLoading();
      }
    });

    // 4. Step 2 -> Extract Facts
    document.getElementById("btn-back-understand")?.addEventListener("click", () => goToStep("describe"));
    document.getElementById("btn-submit-understand")?.addEventListener("click", async () => {
      hideError();
      showLoading("Organizing the information...");
      try {
        const res = await apiPost("/extract-facts", {
          text: state.originalText,
          request_type: state.analysis.type,
          category: state.analysis.category,
        });
        state.facts = res.facts || {};
        goToStep("details");
      } catch (err) {
        showError(`Fact extraction failed: ${err.message}`);
      } finally {
        hideLoading();
      }
    });

    // 5. Step 3 -> Generate Draft
    document.getElementById("btn-back-details")?.addEventListener("click", () => goToStep("understand"));
    document.getElementById("btn-submit-details")?.addEventListener("click", async () => {
      hideError();

      // Collect updated facts
      state.facts.issue = document.getElementById("fact-issue").value.trim();
      state.facts.location = document.getElementById("fact-location").value.trim();
      state.facts.duration = document.getElementById("fact-duration").value.trim();

      const prevComp = document.getElementById("fact-prev-complaint").value;
      state.facts.previous_complaint = prevComp === "true" ? true : prevComp === "false" ? false : null;
      state.facts.previous_complaint_authority = document.getElementById("fact-prev-authority").value.trim();
      state.facts.previous_complaint_date = document.getElementById("fact-prev-date").value.trim();

      const reqAction = document.getElementById("fact-requested-action").value.trim();
      if (state.analysis?.type?.toUpperCase() === "RTI") {
        state.facts.requested_information = reqAction;
      } else {
        state.facts.requested_action = reqAction;
      }

      // Merge clarifications
      const mergedFacts = { ...state.facts };
      const clarificationsList = [];
      Object.keys(state.clarifications).forEach((idx) => {
        const val = state.clarifications[idx]?.trim();
        const q = state.missingQuestions[idx];
        const qText = typeof q === "string" ? q : q?.question || "";
        if (val) clarificationsList.push(`${qText}: ${val}`);
      });
      if (clarificationsList.length > 0) {
        mergedFacts.clarifications = clarificationsList;
        clarificationsList.forEach((item, i) => {
          mergedFacts[`additional_detail_${i + 1}`] = item;
        });
      }

      showLoading("Preparing your application...");
      try {
        const res = await apiPost("/generate-draft", {
          request_type: state.analysis.type,
          category: state.analysis.category,
          facts: mergedFacts,
        });
        state.draft = replaceDatePlaceholders(res.draft);
        state.sources = res.sources || [];
        goToStep("draft");
      } catch (err) {
        showError(`Draft generation failed: ${err.message}`);
      } finally {
        hideLoading();
      }
    });

    // 6. Step 4 -> Draft Review, Mode Toggle, Copy, Print
    document.getElementById("btn-back-draft")?.addEventListener("click", () => goToStep("details"));

    const docView = document.getElementById("draft-document-view");
    const editView = document.getElementById("draft-edit-view");
    const btnModeDoc = document.getElementById("btn-mode-document");
    const btnModeEdit = document.getElementById("btn-mode-edit");

    btnModeDoc?.addEventListener("click", () => {
      btnModeDoc.classList.add("active");
      btnModeEdit.classList.remove("active");
      docView.style.display = "block";
      editView.style.display = "none";
    });

    btnModeEdit?.addEventListener("click", () => {
      btnModeEdit.classList.add("active");
      btnModeDoc.classList.remove("active");
      docView.style.display = "none";
      editView.style.display = "block";
    });

    document.getElementById("btn-done-editing")?.addEventListener("click", () => {
      state.parsedDraft.to = document.getElementById("edit-to").value.trim();
      state.parsedDraft.subject = document.getElementById("edit-subject").value.trim();
      state.parsedDraft.body = document.getElementById("edit-body").value.trim();
      state.parsedDraft.closing = document.getElementById("edit-closing").value.trim();
      state.draft = composeDraftText(state.parsedDraft);

      btnModeDoc?.click();
      renderDraft();
    });

    document.getElementById("btn-copy-draft")?.addEventListener("click", async () => {
      const cleanTo = (state.parsedDraft.to || "").replace(/^to\s*[:,-]?\s*/i, "").trim();
      const textToCopy = [
        cleanTo ? `To:\n${cleanTo}` : "",
        state.parsedDraft.subject ? `\nSubject: ${state.parsedDraft.subject.trim()}\n` : "",
        cleanMarkdown(state.parsedDraft.body) || "",
        state.parsedDraft.closing ? `\n${state.parsedDraft.closing}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        await navigator.clipboard.writeText(textToCopy);
        const copyBtn = document.getElementById("btn-copy-draft");
        const orig = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = orig), 2000);
      } catch (_) {}
    });

    document.getElementById("btn-print-draft")?.addEventListener("click", () => window.print());

    // Regenerate draft confirmation modal
    const regenModal = document.getElementById("modal-regenerate");
    document.getElementById("btn-open-regenerate")?.addEventListener("click", () => {
      regenModal.style.display = "flex";
    });
    document.getElementById("btn-close-regen-modal")?.addEventListener("click", () => {
      regenModal.style.display = "none";
    });
    document.getElementById("btn-cancel-regen")?.addEventListener("click", () => {
      regenModal.style.display = "none";
    });

    document.getElementById("btn-confirm-regen")?.addEventListener("click", async () => {
      regenModal.style.display = "none";
      showLoading("Preparing your application...");
      try {
        const res = await apiPost("/generate-draft", {
          request_type: state.analysis.type,
          category: state.analysis.category,
          facts: state.facts,
        });
        state.draft = replaceDatePlaceholders(res.draft);
        state.sources = res.sources || [];
        renderDraft();
      } catch (err) {
        showError(`Draft regeneration failed: ${err.message}`);
      } finally {
        hideLoading();
      }
    });

    document.getElementById("btn-submit-draft")?.addEventListener("click", () => {
      // Sync from inputs if currently in edit mode
      if (editView.style.display === "block") {
        state.parsedDraft.to = document.getElementById("edit-to").value.trim();
        state.parsedDraft.subject = document.getElementById("edit-subject").value.trim();
        state.parsedDraft.body = document.getElementById("edit-body").value.trim();
        state.parsedDraft.closing = document.getElementById("edit-closing").value.trim();
        state.draft = composeDraftText(state.parsedDraft);
      }
      goToStep("review");
    });

    // 7. Step 5 -> Review & Applicant Validation
    document.getElementById("btn-back-review")?.addEventListener("click", () => goToStep("draft"));

    const handleApplicantChange = () => {
      state.applicant.fullName = document.getElementById("applicant-name").value;
      state.applicant.address = document.getElementById("applicant-address").value;
      state.applicant.phone = document.getElementById("applicant-phone").value;
      state.applicant.email = document.getElementById("applicant-email").value;
      state.confirmed = document.getElementById("check-confirm-review").checked;

      const previewEl = document.getElementById("review-preview-text");
      if (previewEl) {
        previewEl.textContent = cleanMarkdown(
          replaceApplicantPlaceholders(state.draft, state.applicant)
        );
      }

      const isValid =
        Boolean(state.applicant.fullName?.trim()) &&
        Boolean(state.applicant.address?.trim()) &&
        Boolean(state.applicant.phone?.trim()) &&
        state.confirmed;

      const submitBtn = document.getElementById("btn-submit-review");
      if (submitBtn) submitBtn.disabled = !isValid;
    };

    document.getElementById("applicant-name")?.addEventListener("input", handleApplicantChange);
    document.getElementById("applicant-address")?.addEventListener("input", handleApplicantChange);
    document.getElementById("applicant-phone")?.addEventListener("input", handleApplicantChange);
    document.getElementById("applicant-email")?.addEventListener("input", handleApplicantChange);
    document.getElementById("check-confirm-review")?.addEventListener("change", handleApplicantChange);

    document.getElementById("btn-submit-review")?.addEventListener("click", async () => {
      hideError();
      showLoading("Creating your case...");

      const finalDraft = cleanMarkdown(
        replaceApplicantPlaceholders(state.draft, state.applicant)
      );

      try {
        const res = await apiPost("/cases", {
          original_request: state.originalText,
          request_type: state.analysis.type,
          category: state.analysis.category,
          extracted_facts: state.facts,
          draft: finalDraft,
          applicant_details: state.applicant,
        });

        state.caseRecord = res;
        saveCaseToStorage(res);
        goToStep("created");
      } catch (err) {
        showError(`Case creation failed: ${err.message}`);
      } finally {
        hideLoading();
      }
    });

    // 8. Step 6 -> Created
    document.getElementById("btn-created-home")?.addEventListener("click", () => goToStep("describe"));
    document.getElementById("btn-created-cases")?.addEventListener("click", () => goToStep("cases"));

    // Accordions
    document.getElementById("acc-original-toggle")?.addEventListener("click", () => {
      const body = document.getElementById("acc-original-body");
      body.style.display = body.style.display === "none" ? "block" : "none";
    });
    document.getElementById("acc-draft-toggle")?.addEventListener("click", () => {
      const body = document.getElementById("acc-draft-body");
      body.style.display = body.style.display === "none" ? "block" : "none";
    });
    document.getElementById("sources-accordion-toggle")?.addEventListener("click", () => {
      const body = document.getElementById("sources-accordion-body");
      body.style.display = body.style.display === "none" ? "block" : "none";
    });

    // 9. Track Modal
    const trackModal = document.getElementById("modal-track");
    const trackInput = document.getElementById("track-modal-input");
    const trackErr = document.getElementById("track-modal-error");

    const openTrackModal = () => {
      trackErr.style.display = "none";
      trackInput.value = "";
      trackModal.style.display = "flex";
      setTimeout(() => trackInput.focus(), 50);
    };

    const closeTrackModal = () => {
      trackModal.style.display = "none";
    };

    document.getElementById("btn-open-track")?.addEventListener("click", openTrackModal);
    document.getElementById("btn-close-track-modal")?.addEventListener("click", closeTrackModal);
    document.getElementById("btn-cancel-track")?.addEventListener("click", closeTrackModal);
    document.getElementById("link-track-my-cases")?.addEventListener("click", (e) => {
      e.preventDefault();
      closeTrackModal();
      goToStep("cases");
    });

    document.getElementById("form-track-modal")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const num = trackInput.value.trim();
      if (!num) return;

      trackErr.style.display = "none";
      const submitBtn = document.getElementById("btn-submit-track");
      submitBtn.disabled = true;
      submitBtn.textContent = "Searching...";

      try {
        const data = await apiGet(`/cases/${num}`);
        closeTrackModal();
        state.caseRecord = data;
        saveCaseToStorage(data);
        goToStep("created");
      } catch (_) {
        trackErr.style.display = "block";
        trackErr.textContent = "Case not found. Please check the case number.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Track Case";
      }
    });

    // 10. Cases Page Search
    document.getElementById("btn-search-cases")?.addEventListener("click", () => {
      const query = document.getElementById("input-case-search").value.trim();
      if (query) trackAndOpenCase(query);
    });

    // 11. Officer Dashboard Listeners
    document.getElementById("btn-created-officer-shortcut")?.addEventListener("click", () => {
      if (state.caseRecord?.case_number) {
        openOfficerCaseDetail(state.caseRecord.case_number);
      } else {
        goToStep("officer");
      }
    });

    document.getElementById("footer-officer-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "officer";
      goToStep("officer");
    });

    document.getElementById("btn-refresh-officer-cases")?.addEventListener("click", () => {
      renderOfficerDashboard(true);
    });

    document.getElementById("btn-back-to-officer-cases")?.addEventListener("click", () => {
      window.location.hash = "officer";
      goToStep("officer");
    });

    document.getElementById("btn-bottom-back-officer")?.addEventListener("click", () => {
      window.location.hash = "officer";
      goToStep("officer");
    });

    document.getElementById("officer-search-input")?.addEventListener("input", (e) => {
      state.officerSearchQuery = e.target.value.trim();
      renderOfficerCasesRows();
    });

    document.getElementById("officer-filter-status")?.addEventListener("change", (e) => {
      state.officerStatusFilter = e.target.value;
      renderOfficerCasesRows();
    });

    document.getElementById("officer-filter-type")?.addEventListener("change", (e) => {
      state.officerTypeFilter = e.target.value;
      renderOfficerCasesRows();
    });

    document.getElementById("btn-toggle-officer-draft")?.addEventListener("click", () => {
      const wrapper = document.getElementById("officer-draft-wrapper");
      const btn = document.getElementById("btn-toggle-officer-draft");
      if (!wrapper || !btn) return;
      if (wrapper.style.display === "none") {
        wrapper.style.display = "block";
        btn.textContent = "Collapse";
      } else {
        wrapper.style.display = "none";
        btn.textContent = "Expand";
      }
    });

    document.getElementById("btn-officer-update-status")?.addEventListener("click", async () => {
      if (!state.officerCurrentCase?.case_number) return;
      const select = document.getElementById("select-officer-status");
      const btn = document.getElementById("btn-officer-update-status");
      const successAlert = document.getElementById("officer-status-success");
      const newStatus = select ? select.value : "";
      if (!newStatus) return;

      const caseNum = state.officerCurrentCase.case_number;
      btn.disabled = true;
      btn.textContent = "Updating Status...";
      if (successAlert) successAlert.style.display = "none";

      try {
        const updated = await apiPatch(`/cases/${caseNum}/status`, { status: newStatus });
        state.officerCurrentCase = updated;

        // Update in officerCases
        const idx = (state.officerCases || []).findIndex((c) => c.case_number === caseNum);
        if (idx >= 0) state.officerCases[idx] = updated;

        // Update saved cases storage
        saveCaseToStorage(updated);
        if (state.caseRecord && state.caseRecord.case_number === caseNum) {
          state.caseRecord = updated;
        }

        renderOfficerCaseDetail();

        if (successAlert) {
          successAlert.textContent = `Case status updated to ${newStatus} successfully.`;
          successAlert.style.display = "block";
        }
      } catch (err) {
        showError(`Failed to update case status: ${err.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = "Update Status";
      }
    });

    // Hash routing handling
    function handleHashRoute() {
      const hash = window.location.hash;
      if (hash === "#officer") {
        goToStep("officer");
      } else if (hash.startsWith("#officer/cases/")) {
        const num = hash.replace("#officer/cases/", "").trim();
        if (num) openOfficerCaseDetail(num);
        else goToStep("officer");
      } else if (hash === "#cases") {
        goToStep("cases");
      } else if (hash === "#how-it-works") {
        goToStep("how-it-works");
      }
    }

    window.addEventListener("hashchange", handleHashRoute);

    if (window.location.hash) {
      handleHashRoute();
    } else {
      goToStep("describe");
    }
  });
})();
