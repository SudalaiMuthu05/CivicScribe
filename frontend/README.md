# The Grievance Scribe — Frontend

A citizen-facing frontend for converting a plain-language complaint or
information request into a structured Government Grievance or RTI
Application. Built with React, Vite, React Router, and Tailwind CSS.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the FastAPI backend at
`http://127.0.0.1:8000/api` (configurable via `VITE_API_BASE_URL` in `.env`).

## Project structure

```
src/
  api/client.js          Centralized API client (all backend calls)
  context/RequestContext.jsx  Shared request state, persisted to sessionStorage
  components/            Reusable UI building blocks
  pages/                 One file per route
```

## Flow

Home → Start → Analyze → Details (facts + missing info) → Draft → Review →
Case Created → Case tracking (My Cases).

Progress within an in-flight request is kept in `sessionStorage` so a page
refresh doesn't lose work. Created case numbers are kept in `localStorage`
on this device only, under "My Cases" — this is not an authenticated
account history.

## Notes

- Status changes (`PATCH /api/cases/{case_number}/status`) are intentionally
  not exposed in the citizen UI. That belongs in a future admin surface.
- "Create Case" only creates a record in this system — it does not submit
  anything to a government authority, and the UI is worded accordingly.
