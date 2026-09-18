# CivicScribe 🏛️

**CivicScribe** is an AI-powered, multilingual, and multimodal citizen grievance intelligence platform. It transforms raw, unstructured citizen complaints (text, voice, or image evidence in languages such as English, Tamil, Tanglish, Hindi, Hinglish, etc.) into structured civic issues, routes them dynamically to government authorities using Relational RAG, detects duplicate issues semantically, and assesses issue severity.

---

## 🌟 Key Features

- **🌐 Multilingual & Transliterated Understanding**: Accepts complaints in natural or transliterated languages (e.g., Tanglish *"en theruvil pothole irukku 1st street"*), normalizes input, and extracts core issue facts without inventing information.
- **📸 Multimodal Vision Evidence Analysis**: Uploaded photographic evidence stored on Cloudinary is analyzed using **Qwen Vision (`qwen/qwen3.8-27b`)** to verify object detection, image relevance, and text-to-image consistency.
- **🧠 Relational RAG Authority Routing**: Dynamically retrieves active government authorities and jurisdiction routing rules from Supabase and injects them into Groq LLM context to ground routing decisions without hardcoded rules.
- **🔎 Vector & RAG Duplicate Detection**: Uses TF-IDF cosine vector similarity + Groq LLM RAG verification to link new complaints to existing real-world civic issues at the same location.
- **🚨 Attention & Severity Engine**: Evaluates immediate safety risks, public impact, and infrastructure disruption to assign an attention score (0–100) and severity level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **🔍 Semantic Search**: Allows citizens and administrators to search open civic issues using natural language queries via vector similarity matching.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.10+) |
| **AI / LLM Infrastructure** | Groq API (`openai/gpt-oss-20b` for text / `qwen/qwen3.8-27b` for vision) |
| **Database** | Supabase (PostgreSQL with custom functions, triggers, & RLS) |
| **Cloud Storage** | Cloudinary (Image & Evidence Hosting) |
| **Frontend Framework** | React.js / Vite + Vanilla CSS |
| **Data Validation** | Pydantic v2 & Pydantic Settings |

---

## 📁 Repository Structure

```
CivicScribe/
├── backend/
│   ├── main.py                          # FastAPI Application Entry Point
│   ├── requirements.txt                 # Backend Python Dependencies
│   ├── .env.example                     # Environment Variables Template
│   ├── config/                          # App Settings Configuration
│   ├── database/                        # Supabase Client, Repositories, & SQL Schema
│   │   ├── migrations/schema.sql        # Supabase Database Schema & Triggers
│   │   └── repositories/               # Repository Access Pattern
│   ├── models/                          # Pydantic Request & Response Schemas
│   ├── routes/                          # FastAPI API Endpoints
│   │   ├── health_routes.py             # Health & DB Connection Checks
│   │   ├── complaint_routes.py          # Complaint & Multimodal Processing
│   │   ├── analysis_routes.py           # AI Relevance, Issue, Severity, & Similarity
│   │   └── image_routes.py              # Evidence Upload & Vision Processing
│   ├── services/                        # Business Logic & AI Engines
│   │   ├── complaint_service.py         # Main Complaint Lifecycle Orchestrator
│   │   ├── groq_service.py              # Groq LLM Client Interface
│   │   ├── vision_service.py            # Multimodal Qwen Vision Integration
│   │   ├── authority_routing_service.py # RAG Authority Routing Service
│   │   ├── duplicate_service.py         # Vector & RAG Duplicate Matcher
│   │   ├── cloudinary_service.py        # Media Storage Uploader & Manager
│   │   └── intelligence/
│   │       └── similarity_service.py    # Cosine Vector & N-gram Similarity Engine
│   └── tests/                           # Unit & Integration Tests
├── frontend/                            # Vite + React Frontend Application
└── docs/                                # Architecture & System Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18+ (for frontend)
- Supabase project account & API keys
- Cloudinary account credentials
- Groq API key

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   *Example `.env` configuration*:
   ```env
   APP_NAME=CivicScribe
   DEBUG=true

   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-key

   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=openai/gpt-oss-20b
   GROQ_VISION_MODEL=qwen/qwen3.8-27b
   ```

5. **Initialize Supabase Database**:
   Execute the SQL script located in `backend/database/migrations/schema.sql` inside your Supabase SQL Editor.

6. **Start the FastAPI Dev Server**:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://127.0.0.1:8000`. You can inspect the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API health status check |
| `GET` | `/health/supabase` | Supabase database connection check |
| `POST` | `/complaints` | Submit text complaint (runs AI pipeline & creation) |
| `POST` | `/complaints/multimodal` | Submit complaint with text, location, & image file |
| `GET` | `/complaints/search/semantic` | Natural language semantic search over open civic issues |
| `POST` | `/analysis/relevance` | Check if input text is a valid civic grievance |
| `POST` | `/analysis/issue` | Perform AI issue extraction & category classification |
| `POST` | `/analysis/severity` | Calculate AI urgency score & risk factors |
| `POST` | `/analysis/similarity` | Calculate vector & RAG semantic similarity between two texts |
| `POST` | `/images/upload` | Upload evidence image to Cloudinary & run Vision AI |

---

## 🧪 Running Tests

Run the test suite to verify vector similarity and duplicate issue detection logic:
```bash
PYTHONPATH=backend python3 backend/tests/test_duplicate.py
```

---

## 🛡️ License

This project is open-source and available under the [MIT License](LICENSE).
