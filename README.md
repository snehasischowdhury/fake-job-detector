[readme.md](https://github.com/user-attachments/files/34870245/readme.md)
# Fake Job Detector

An AI-powered recruitment screening platform that helps job seekers evaluate job postings for potential fraud before sharing personal or financial information. Built with **React + TypeScript + Tailwind CSS** on the frontend and **FastAPI + scikit-learn + SQLAlchemy** on the backend.

---

## Key Features

- **NLP Fraud Screening:** Evaluates concatenated posting text (`title`, `company_profile`, `description`, `requirements`, `benefits`) using a serialized `TfidfVectorizer` + `LogisticRegression` pipeline (`models/job_detector.pkl`) loaded once at startup.
- **Independent Heuristic Engine:** Transparently flags explicit red flags (upfront registration fees, personal bank forwarding, off-platform Telegram/WhatsApp recruitment, missing company profiles) without altering the ML model's score or class.
- **Configurable Risk Tiers:** Maps uncalibrated model scores (`0.00–1.00`) into `LOW RISK`, `MEDIUM RISK`, and `HIGH RISK` presentation tiers with user-adjustable thresholds.
- **Interactive Dashboard & History:** Tracks analyzed postings, risk-tier distributions, and daily screening trends with search, filtering, sorting, and deletion backed by SQLite (dev) or PostgreSQL (prod).
- **Security Hardening:** Enforces Pydantic v2 input validation, `64 KB` request payload caps, per-IP sliding-window rate limiting (`429`), strict CORS, and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

---

## Architecture

```text
+-------------------------------------------------------------------+
|                        FRONTEND (Vercel)                          |
|   React 18 + Vite + TypeScript + Tailwind CSS + Recharts + Lucide |
|   [Landing] [Analyze Form] [Results] [Dashboard] [History] [About]|
+---------------------------------+---------------------------------+
                                  | HTTPS / JSON (REST API)
                                  v
+-------------------------------------------------------------------+
|                  BACKEND API (Render / Railway)                   |
|                  FastAPI + Pydantic v2 + Uvicorn                  |
|                                                                   |
|  +-----------------------+    +--------------------------------+  |
|  | API Routes (/api/v1)  |    | Security & Middleware          |  |
|  | - POST /predict       |    | - CORS, Rate Limit, Size Cap   |  |
|  | - GET  /health        |    | - Security Headers & Sanitized |  |
|  | - GET/DEL /history    |    |   Error Handling               |  |
|  | - GET  /statistics    |    +--------------------------------+  |
|  +-----------+-----------+                                        |
|              |                                                    |
|     +--------+--------------------+                               |
|     v                             v                               |
|  +--------------------------+  +-------------------------------+  |
|  | ML Inference Service     |  | Heuristic Warning Engine      |  |
|  | - Loaded once at startup |  | - Independent rule checks     |  |
|  | - job_detector.pkl       |  | - Never alters ML prediction  |  |
|  +--------------------------+  +-------------------------------+  |
+---------------------------------+---------------------------------+
                                  | SQLAlchemy 2.0
                                  v
+-------------------------------------------------------------------+
|              DATABASE (SQLite Dev -> PostgreSQL Prod)             |
|   Table: job_analyses (id, title, company, payload, score, ...)   |
+-------------------------------------------------------------------+
```

---

## Dataset & Model Transparency

- **Dataset (`17,880` records):** `17,014` legitimate (`95.16%`) and `866` fraudulent (`4.84%`) job postings.
- **Audit Findings:** `67.78%` of fraudulent postings lack a `company_profile` (vs. `15.99%` of legitimate postings), and `1,887` near-duplicate template records exist across `(title, company_profile, description, requirements)`.
- **Pipeline:** `TfidfVectorizer(max_features=10000, ngram_range=(1, 2), stop_words="english")` + `LogisticRegression(class_weight="balanced", max_iter=1000)` (`scikit-learn==1.9.0`).
- **Responsible AI Note:** Balanced class weighting shifts the decision intercept; predicted scores are advisory screening indicators, not calibrated probabilities or definitive proof of fraud.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/predict` | Validates posting, runs ML + heuristics, persists record |
| `GET` | `/api/v1/health` | Verifies API status, model availability, and DB connection |
| `GET` | `/api/v1/history` | Paginated, searchable, filterable, and sortable history |
| `GET` | `/api/v1/history/{id}` | Retrieves a single stored analysis record |
| `DELETE` | `/api/v1/history/{id}` | Deletes a stored analysis record |
| `GET` | `/api/v1/statistics` | Returns aggregated KPI counts and risk distributions |

---

## Project Structure

```text
fake-job-detector/
├── frontend/                  # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Layout, UI primitives, analysis, dashboard, history
│   │   ├── context/           # Centralized AnalysisContext state
│   │   ├── pages/             # Landing, Analyze, Results, Dashboard, History, About
│   │   ├── services/          # Separated Mock & FastAPI HTTP clients
│   │   └── __tests__/         # Vitest & React Testing Library suites
│   └── vercel.json            # SPA routing configuration
├── backend/                   # FastAPI + SQLAlchemy + scikit-learn
│   ├── app/
│   │   ├── api/routes/        # health, prediction, history, statistics
│   │   ├── core/              # model_loader, preprocessing, prediction_service, heuristics
│   │   ├── database/          # SQLAlchemy connection, ORM models, repository
│   │   ├── schemas/           # Pydantic v2 request/response schemas
│   │   └── utils/             # Logging & sliding-window rate limiter
│   ├── ml_validation/         # Reproducible deduplicated evaluation script
│   ├── models/                # Serialized job_detector.pkl
│   ├── tests/                 # Pytest API & security tests
│   ├── Dockerfile
│   └── render.yaml
└── README.md
```

---

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/v1/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm test
npm run build
npm run dev
```

Application URL: `http://localhost:5173/`

### 3. Offline Model Evaluation

```bash
cd backend
source .venv/bin/activate
pip install pandas
python ml_validation/evaluate_model.py --dataset /path/to/fake_job_postings.csv.zip
```

---

## Production Deployment

1. **Backend & PostgreSQL (Render):** Deploy `backend/` using `Dockerfile` or `render.yaml`, configure `DATABASE_URL` (PostgreSQL) and `CORS_ORIGINS`, and verify `/api/v1/health`.
2. **Frontend (Vercel):** Deploy `frontend/` with `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL` pointing to your live backend `/api/v1`.
