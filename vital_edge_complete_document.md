# Vital-Edge: AI Triage Optimizer — Complete Project Document

> **Purpose of this document:** Study guide + evaluator briefing for the Vital-Edge project presentation.  
> Share this entire document with ChatGPT and say: *"You are my project evaluator. Ask me questions about this project one by one and evaluate my answers."*

---

## 1. PROJECT OVERVIEW

### Project Name
**Vital-Edge — AI-Powered Emergency Triage Optimizer**

### One-Line Description
A full-stack web application that uses a deterministic AI scoring engine to automatically prioritize emergency patients in hospitals and ambulances — replacing subjective, error-prone manual triage with data-driven, explainable decisions.

### Problem Statement
In government hospitals and emergency departments, triage (deciding who gets treated first) is done manually by nurses and paramedics under extreme time pressure. This leads to:
- **Human error** due to fatigue and stress
- **Inconsistent decisions** — two nurses may assign different priorities to the same patient
- **No transparency** — patients and families don't understand why priorities were assigned
- **Delayed care** in ambulances — no triage happens before arrival
- **No audit trail** — no record of who made which decision and why

### Objective
Build a system that:
1. Accepts patient vitals and symptoms as input
2. Runs an AI scoring algorithm to determine priority (CRITICAL / MODERATE / STABLE)
3. Provides full explainability — *why* this priority was assigned
4. Supports ambulance mode — enables pre-hospital triage with ETA
5. Saves every decision to a database for audit and analysis
6. Shows a real-time dashboard with statistics and recent entries
7. Allows medical staff to override AI decisions (with logged reason)

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                      USER (Browser)                      │
│              https://vital-edge-wine.vercel.app          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST API (JSON)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              FRONTEND (React + Vite + TypeScript)         │
│                   Hosted on: Vercel                       │
│  Pages: Triage Input | Triage Result | Dashboard         │
└──────────────────────┬──────────────────────────────────┘
                       │ axios HTTP calls
                       │
┌──────────────────────▼──────────────────────────────────┐
│              BACKEND (Node.js + Express + TypeScript)     │
│         Hosted on: Render (free tier)                     │
│  https://vital-edge-backend.onrender.com                  │
│                                                           │
│  Services:                                                │
│  ├── TriageEngine       (scoring algorithm)               │
│  ├── ExplainabilityService (why this decision?)           │
│  ├── RiskAssessmentService (deterioration risk)           │
│  └── AuditLoggerService    (tracks all actions)           │
└──────────────────────┬──────────────────────────────────┘
                       │ Supabase JS client
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATABASE (Supabase)                     │
│              PostgreSQL (managed cloud DB)                │
│  Tables: triage_records | audit_logs                     │
└─────────────────────────────────────────────────────────┘
```

### Architecture Pattern
**3-Tier Architecture:**
- **Presentation Layer** — React frontend on Vercel
- **Business Logic Layer** — Express.js backend on Render
- **Data Layer** — PostgreSQL via Supabase

---

## 3. TECHNOLOGY STACK

| Layer | Technology | Why Chosen |
|-------|-----------|------------|
| Frontend Framework | React 18 + Vite | Fast dev server, component-based UI |
| Frontend Language | TypeScript | Type safety, fewer runtime bugs |
| Frontend Styling | Tailwind CSS + shadcn/ui | Rapid, consistent UI components |
| Charts | Recharts | React-native chart library |
| HTTP Client | Axios | Interceptor support, timeout control |
| Backend Framework | Express.js | Lightweight, flexible REST API |
| Backend Language | TypeScript | Shared types with frontend |
| Input Validation | Zod | Schema-based validation with TypeScript inference |
| Database | Supabase (PostgreSQL) | Real-time capable, free tier, no setup needed |
| Logging | Winston | Structured logging for production |
| Frontend Hosting | Vercel | Free, auto-deploys from GitHub |
| Backend Hosting | Render | Free Node.js server hosting |

---

## 4. KEY FEATURES (DETAILED)

### Feature 1: Triage Input Form
**What it does:** Collects patient data through a structured form.

**Inputs collected:**
- Patient: Name, Age, Gender (Male/Female/Other)
- Vital Signs:
  - Blood Pressure (systolic / diastolic in mmHg)
  - Pulse/Heart Rate (bpm)
  - Temperature (°C)
  - SpO2 / Oxygen Saturation (%)
  - Respiratory Rate (breaths/min)
- Symptoms (checkboxes — Yes/No):
  - Chest Pain, Breathlessness, Bleeding, Unconscious, Seizure, Fever, Abdominal Pain, Trauma
  - Free text: Other symptoms
- Mode: HOSPITAL or AMBULANCE
- If AMBULANCE: ETA in minutes, Operator name

**Validation:** All inputs are validated using Zod on the backend. Invalid inputs return HTTP 400 with specific error details.

---

### Feature 2: AI Triage Engine (Core Feature)
**What it does:** Calculates a priority score using a deterministic rule-based algorithm.

#### How the Scoring Works:

**VITAL SIGNS SCORE (max 40 points)**

| Parameter | Condition | Points |
|-----------|-----------|--------|
| SpO2 | < 85% | 15 pts |
| SpO2 | 85–90% | 10 pts |
| SpO2 | 90–94% | 5 pts |
| Pulse | > 140 or < 40 bpm | 12 pts |
| Pulse | > 120 or < 50 bpm | 7 pts |
| Pulse | > 100 or < 60 bpm | 3 pts |
| Blood Pressure (systolic) | > 200 or < 70 | 12 pts |
| Blood Pressure (systolic) | > 180 or < 90 | 7 pts |
| Blood Pressure (systolic) | > 140 or < 100 | 3 pts |
| Respiratory Rate | > 30 or < 8 | 10 pts |
| Respiratory Rate | > 24 or < 10 | 5 pts |
| Temperature | > 40°C | 8 pts |
| Temperature | > 39°C | 4 pts |
| Temperature | < 35°C | 6 pts |

**Vital Score is clamped to maximum 40.**

**SYMPTOM SCORE (max 40 points)**

| Symptom | Points | Type |
|---------|--------|------|
| Unconscious | 40 pts | RED FLAG |
| Seizure | 38 pts | RED FLAG |
| Chest Pain | 35 pts | RED FLAG |
| Breathlessness | 20 pts | High severity |
| Trauma | 18 pts | High severity |
| Bleeding | 10 pts | Moderate |
| Fever | 8 pts | Moderate |
| Abdominal Pain | 7 pts | Moderate |
| Other | 5 pts | Low |

**Note:** RED FLAG symptoms (unconscious, seizure, chest pain) prevent other symptoms from adding to the score (only one can active affect the total at a time). Symptom score is also clamped to 40.

**TOTAL SCORE = Vital Score + Symptom Score (max 80)**

**PRIORITY DECISION:**
| Score | Priority | Display Color |
|-------|----------|---------------|
| Any RED FLAG symptom OR total ≥ 60 | RED (CRITICAL) | Red |
| 30–59 | YELLOW (MODERATE) | Yellow/Orange |
| < 30 | GREEN (STABLE) | Green |

**CONFIDENCE SCORE:**
- Base: 70%
- +20% if total score is high (more certain about severity)
- +10% if both vital and symptom data contribute
- Capped at 98% (never 100% — AI should be humble)

---

### Feature 3: Explainability System
**What it does:** Explains every AI decision in plain English. Critical for healthcare — doctors must understand *why* the AI decided what it did.

**Four outputs:**
1. **Reasoning** — Top 5 clinical factors that contributed to the score (sorted by highest points), e.g., "Chest pain detected (RED FLAG — potential cardiac emergency)"
2. **Why Not RED?** — If patient is MODERATE/STABLE, explains what kept them out of CRITICAL
3. **Why Not GREEN?** — If patient is CRITICAL/MODERATE, explains what prevented a stable classification
4. **Bias Note** — States explicitly: "No demographic factors (age, gender, ethnicity) were used in the priority calculation. The AI treats all patients equally based on medical need alone."

---

### Feature 4: Risk Assessment & Deterioration Prediction
**What it does:** Predicts how quickly the patient may deteriorate if not treated.

**Outputs:**
- **Deterioration Risk:** HIGH / MEDIUM / LOW
- **Risk Timeframe:** e.g., "5–15 minutes", "30–60 minutes", "> 2 hours"
- **Risk Indicators:** Specific clinical warnings, e.g., "Hypoxia progression risk — monitor O₂ saturation closely"
- **Preparation Notes:** Instructions for medical staff, e.g., "Equipment: ECG monitor, defibrillator, cardiac crash cart"

**Logic:**
- RED priority + 2+ critical score factors → HIGH risk
- YELLOW priority with breathlessness or bleeding → MEDIUM risk
- GREEN priority → LOW risk

---

### Feature 5: Ambulance Mode
**What it does:** Enables pre-hospital triage — paramedics can classify a patient while still in the ambulance, before reaching the hospital.

**Special behaviors:**
- ETA (minutes to arrival) is captured
- Alert timestamp is recorded (when the ambulance notification was sent)
- Preparation notes include "⏱️ ETA: X minutes — prepare receiving team"
- Dashboard shows ambulance vs hospital counts separately

---

### Feature 6: Priority Override
**What it does:** Allows a senior doctor/nurse to disagree with the AI and change the priority.

**How it works:**
1. Doctor selects new priority (CRITICAL / MODERATE / STABLE) on the result page
2. Must provide a written reason (minimum 5 characters)
3. Backend updates the database record and flags `is_overridden = true`
4. Audit log records: who overrode, from what priority, to what priority, and the reason
5. Dashboard shows the override tag on the result

**Why this matters:** Keeps humans in control. The AI assists, it doesn't replace medical judgment.

---

### Feature 7: Real-Time Dashboard
**What it shows:**
- **Metrics:**  Total cases (today + yesterday), Critical count, Moderate count, Stable count
- **Additional:** Average AI confidence %, High risk patient count, Ambulance mode count
- **Chart:** Bar chart showing distribution of Critical/Moderate/Stable
- **Table:** Last 30 entries (today + yesterday) with: Name, Priority badge, Confidence %, Risk level, Mode (Hospital/Ambulance), Date & Time

---

### Feature 8: CSV Export
**What it does:** One-click export of all triage records to a CSV file for offline review, reporting, and analysis.

---

### Feature 9: Audit Logging
**What it does:** Every significant action is recorded in the `audit_logs` database table.

**Logged events:**
- `TRIAGE_CREATED` — whenever a new triage is submitted
- `PRIORITY_OVERRIDDEN` — whenever a doctor changes the AI's decision
- `RECORD_EXPORTED` — whenever CSV export is triggered

**Each log contains:** action type, triage ID, operator name, timestamp, and relevant details.

---

### Feature 10: Server Status Banner
**What it does:** Because the backend is hosted on Render's free tier, it "sleeps" after 15 minutes of inactivity. The first request after sleep takes up to 60 seconds (cold start).

The frontend automatically pings the backend health endpoint on page load and shows a colored status banner:
- 🔵 Blue: Connecting…
- 🟡 Amber: Server waking up (cold start) — please wait
- 🟢 Green: Server is online — ready
- 🔴 Red: Cannot reach server

---

## 5. API REFERENCE

### Base URL
`https://vital-edge-backend.onrender.com`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check — returns `{ status: "healthy" }` |
| POST | `/api/triage` | Submit new triage case → returns full TriageResult |
| GET | `/api/triage/:id` | Get a specific triage record by ID |
| POST | `/api/triage/:id/override` | Override the AI priority with a reason |
| GET | `/api/dashboard/summary` | Get dashboard stats + last 30 recent entries |
| GET | `/api/export/csv` | Download all triage records as CSV |
| GET | `/api/audit-logs` | Get audit log history |

### Sample POST /api/triage Request Body
```json
{
  "patient": { "name": "Rajesh Kumar", "age": 55, "gender": "MALE" },
  "vitals": {
    "bloodPressure": { "systolic": 160, "diastolic": 95 },
    "pulse": 110,
    "temperature": 37.2,
    "spo2": 88,
    "respiratoryRate": 26
  },
  "symptoms": {
    "chestPain": true,
    "breathlessness": true,
    "bleeding": false,
    "unconscious": false,
    "seizure": false,
    "fever": false,
    "abdomenPain": false,
    "trauma": false
  },
  "mode": "AMBULANCE",
  "etaMinutes": 8,
  "operatorName": "Dr. Priya"
}
```

### Sample Response
```json
{
  "id": "uuid-xxxx",
  "priority": "RED",
  "confidence": 95,
  "score": {
    "totalScore": 57,
    "vitalScore": 22,
    "symptomScore": 35
  },
  "explainability": {
    "reasoning": ["Chest pain (RED FLAG)", "SpO₂ 88% — severe hypoxia", ...],
    "whyNotRed": "N/A - Patient assigned RED priority",
    "whyNotGreen": "...",
    "biasNote": "No demographic factors used..."
  },
  "riskAssessment": {
    "deteriorationRisk": "HIGH",
    "riskTimeframe": "15-30 minutes",
    "riskIndicators": ["Cardiac instability", "Respiratory failure risk"],
    "preparationNotes": ["🚨 CRITICAL: Prepare resuscitation bay", "Equipment: ECG monitor..."]
  }
}
```

---

## 6. DATABASE SCHEMA

### Table: `triage_records`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated unique ID |
| priority | TEXT | RED / YELLOW / GREEN |
| confidence_score | INTEGER | 0–98 (%) |
| total_score | INTEGER | 0–80 |
| vital_score | INTEGER | 0–40 |
| symptom_score | INTEGER | 0–40 |
| score_breakdown | JSONB | Array of { category, points, reason } |
| reasoning | JSONB | Array of explanation strings |
| why_not_red | TEXT | Explanation text |
| why_not_green | TEXT | Explanation text |
| bias_note | TEXT | Fairness statement |
| deterioration_risk | TEXT | HIGH / MEDIUM / LOW |
| risk_timeframe | TEXT | e.g., "15-30 minutes" |
| risk_indicators | JSONB | Array of clinical risk strings |
| preparation_notes | JSONB | Array of action strings |
| patient_name | TEXT | Patient's name |
| patient_age | INTEGER | Age in years |
| patient_gender | TEXT | MALE / FEMALE / OTHER |
| bp_systolic | INTEGER | mmHg |
| bp_diastolic | INTEGER | mmHg |
| pulse | INTEGER | bpm |
| temperature | DECIMAL | °C |
| spo2 | INTEGER | % |
| respiratory_rate | INTEGER | breaths/min |
| chest_pain | BOOLEAN | Symptom flag |
| breathlessness | BOOLEAN | Symptom flag |
| bleeding | BOOLEAN | Symptom flag |
| unconscious | BOOLEAN | Symptom flag |
| seizure | BOOLEAN | Symptom flag |
| fever | BOOLEAN | Symptom flag |
| abdomen_pain | BOOLEAN | Symptom flag |
| trauma | BOOLEAN | Symptom flag |
| other_symptoms | TEXT | Free text |
| mode | TEXT | HOSPITAL / AMBULANCE |
| eta_minutes | INTEGER | Ambulance ETA |
| alert_sent_at | TIMESTAMP | Ambulance alert time |
| operator_name | TEXT | Who submitted |
| is_overridden | BOOLEAN | Override flag |
| override_reason | TEXT | Override justification |
| created_at | TIMESTAMP | Auto-set by Supabase |

### Table: `audit_logs`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| action | TEXT | TRIAGE_CREATED / PRIORITY_OVERRIDDEN / RECORD_EXPORTED |
| triage_id | UUID (FK) | Reference to triage_records |
| details | JSONB | Action-specific metadata |
| operator_name | TEXT | Who performed the action |
| created_at | TIMESTAMP | When it happened |

---

## 7. DEPLOYMENT

### Frontend — Vercel
- **URL:** https://vital-edge-wine.vercel.app
- **Build command:** `npm run build` (Vite)
- **Framework:** Vite + React
- **Environment variables set on Vercel:**
  - `VITE_API_URL` = backend Render URL
  - `VITE_SUPABASE_URL` = Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` = Supabase public key

### Backend — Render
- **URL:** https://vital-edge-backend.onrender.com
- **Build command:** `npm install && npm run build` (TypeScript → JavaScript)
- **Start command:** `npm run start` (runs compiled `dist/server.js`)
- **Environment variables set on Render dashboard:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `CORS_ORIGIN` (Vercel frontend URL)
  - `NODE_ENV` = production

### Database — Supabase
- Managed PostgreSQL
- Tables created manually via Supabase SQL editor
- Connected via `@supabase/supabase-js` client

### Important: Render Free Tier Cold Start
Render's free tier puts backends to sleep after 15 minutes of inactivity. The first request after sleep triggers a "cold start" that takes ~30–60 seconds. The frontend handles this gracefully with a status banner and automatic retry.

---

## 8. DATA FLOW (Step by Step)

1. **User fills the triage form** on the React frontend
2. **Frontend validates** basic inputs (required fields, number ranges)
3. **Axios sends POST /api/triage** to the Express backend
4. **Backend validates** the request body using Zod schema
5. **TriageEngine.calculateTriage()** runs the scoring algorithm:
   - Calculates vital score (0–40)
   - Calculates symptom score (0–40)
   - Combines for total score (0–80)
   - Determines priority (RED/YELLOW/GREEN)
   - Calculates confidence (70–98%)
6. **ExplainabilityService.generateExplainability()** creates human-readable explanations
7. **RiskAssessmentService.assessRisk()** calculates deterioration risk and preparation notes
8. **Supabase insert** saves the full record to the database
9. **AuditLogger** records the TRIAGE_CREATED event
10. **Backend returns** the complete TriageResult (HTTP 201)
11. **Frontend navigates** to the Triage Result page and displays all data
12. **Dashboard** fetches fresh data from GET /api/dashboard/summary showing updated stats

---

## 9. SECURITY CONSIDERATIONS

- **Input validation** on every API endpoint using Zod — prevents bad data
- **CORS** configured — only the Vercel frontend can call the backend
- **Environment variables** — API keys are never in the code, always in env vars
- **Supabase Anon Key** — only allows public read/write as configured (no admin operations from frontend)
- **Audit trail** — every action logged with timestamp for accountability
- **Override tracking** — AI decisions can be overridden but the override is always recorded

---

## 10. LIKELY EVALUATOR QUESTIONS & ANSWERS

### General / Problem Statement

**Q1: What problem does your project solve?**
A: In emergency departments, manual triage by overworked nurses leads to inconsistent, slow, and undocumented priority decisions. Vital-Edge automates this using an AI engine that scores patients based on vitals and symptoms, giving consistent, explainable, and auditable triage decisions within seconds.

**Q2: Why is triage important?**
A: Triage determines who gets treated first. In emergency medicine, a wrong triage decision can cost a life. A patient with a heart attack classified as "stable" because the nurse was busy could die while waiting. Automation reduces this risk.

**Q3: Is this AI or a simple rule-based system?**
A: It's a **deterministic rule-based AI system** — often called a "clinical decision support system." Unlike black-box ML models, every decision has traceable logic. This is actually preferred in healthcare because doctors need to understand and trust the system. It mimics how a medically trained clinician applies established scoring systems like the Manchester Triage System (MTS) or NEWS2 score.

---

### Technical Questions

**Q4: What is your tech stack?**
A: Frontend: React + TypeScript + Vite, hosted on Vercel. Backend: Node.js + Express + TypeScript, hosted on Render. Database: PostgreSQL via Supabase. No ML models — pure rule-based scoring.

**Q5: Why did you use TypeScript on both frontend and backend?**
A: TypeScript's type system lets me define `TriageResult`, `VitalSigns`, `Symptoms` as shared interfaces. Both the frontend and backend agree on exactly what shape the data is — this prevents API contract mismatches and catches bugs at compile time, not runtime.

**Q6: Why Supabase instead of MongoDB or Firebase?**
A: Triage data is highly structured (fixed columns for vitals, symptoms, scores). A relational database (PostgreSQL) is perfect for this — it enforces schema integrity. Supabase adds a managed cloud host with a JavaScript client library, making it easy to use from Node.js.

**Q7: What is Zod and why do you use it?**
A: Zod is a TypeScript-first validation library. When the frontend sends a POST request, Zod checks every field — is the systolic BP a number between 40 and 300? Is gender one of MALE/FEMALE/OTHER? If not, it immediately returns a 400 error with specific field-level errors, preventing bad data from reaching the scoring engine.

**Q8: How does CORS work in your system?**
A: The backend is configured to only accept requests from the Vercel frontend URL. The `cors` middleware checks the `Origin` header of every incoming request. If a request comes from anywhere else (e.g., someone trying to call the API directly), it's blocked. This prevents unauthorized use of the backend.

**Q9: How do you handle deployment on a free-tier backend?**
A: Render's free tier spins down after 15 minutes of inactivity. To handle this gracefully, the frontend: (1) pings /health on every page load, (2) auto-retries failed requests once after a 2-second wait, (3) shows a status banner telling the user the server is waking up, (4) uses a 70-second axios timeout (Render cold start takes up to 60 seconds).

---

### Algorithm / AI Questions

**Q10: Explain your scoring algorithm.**
A: There are two independent subscores, each out of 40 points:
- **Vital Score:** Each vital sign (SpO2, pulse, BP, respiratory rate, temperature) contributes points proportional to how far it deviates from the normal range. Critical deviations give maximum points.
- **Symptom Score:** Each symptom contributes points based on severity. RED FLAG symptoms (unconscious, seizure, chest pain) give the highest points and auto-escalate to RED priority.
Both are clamped to 40, summed for a max of 80, and the priority decision is: ≥60 → CRITICAL, 30–59 → MODERATE, <30 → STABLE.

**Q11: Why did you cap the score at 80 and not 100?**
A: The design uses two subscores (vitals max 40 + symptoms max 40 = 80 total). The displayed "out of 80" reflects the actual mathematical maximum of the algorithm. Previously it incorrectly showed /100 — this was a bug we fixed.

**Q12: What is a RED FLAG symptom?**
A: RED FLAG symptoms are clinical conditions that are immediately life-threatening regardless of other vitals. These are: unconsciousness, active seizure, and chest pain. If any of these are present, the patient is automatically escalated to RED priority, even if their vitals look acceptable temporarily.

**Q13: How do you calculate confidence?**
A: Confidence = 70% (base) + up to 20% based on total score magnitude (higher score = more certainty) + 10% if both vitals and symptoms contribute data. It's capped at 98% — an AI system in healthcare should never claim to be 100% certain.

**Q14: What is explainability and why does it matter in healthcare AI?**
A: Explainability means the system shows *why* it made a decision. A doctor will never blindly trust an AI — they need to understand the reasoning. If the system says CRITICAL, the doctor can see: "chest pain RED FLAG, SpO2 88% severe hypoxia, pulse 130 bpm elevated." This builds trust and allows the doctor to verify or override intelligently.

**Q15: What is the bias note for?**
A: It explicitly states that no demographic data (age, gender, ethnicity, economic status) was used in the priority calculation. In Indian government hospitals, there is risk of implicit bias — patients being deprioritized based on socioeconomic status. The system documents its fairness for accountability.

**Q16: Why is the override feature important?**
A: The AI is an assistant, not a replacement for medical judgment. A doctor may know context the system doesn't — a patient who appears stable may have a known cardiac history. The override lets the doctor supersede the AI decision while creating an audit trail that shows: who overrode, what it was changed from/to, and the justification.

---

### Feature Questions

**Q17: What is Ambulance Mode?**
A: In Ambulance Mode, a paramedic enters patient data while still in transit. The system calculates the triage, records the ETA, and the preparation notes include "ETA: X minutes — prepare receiving team." This allows the hospital to begin preparing the right room and equipment before the patient arrives.

**Q18: What does the Dashboard show?**
A: The dashboard shows: total case count for today and yesterday, count of Critical/Moderate/Stable cases, average AI confidence %, number of high-risk patients, number of ambulance cases, a bar chart of the priority distribution, and a table of the last 30 triage entries with name, priority, confidence, risk level, mode, and date/time.

**Q19: What does the CSV export do?**
A: It downloads all triage records as a comma-separated values file that can be opened in Excel. This allows hospital administrators to perform deeper analysis, create reports, and maintain records offline.

**Q20: What is the audit log?**
A: A database table (`audit_logs`) that records every significant action: when a triage was created, when a priority was overridden, and when data was exported. Each entry includes the timestamp, operator name, and what changed. This is essential for medical-legal accountability.

---

### Design / Architecture Questions

**Q21: Why separate the frontend and backend instead of a monolith?**
A: Separation of concerns. The frontend can be updated without touching the backend. Different teams can work independently. The backend can serve multiple clients (mobile app, another dashboard). Hosted separately — Vercel (frontend CDN) is different from Render (backend compute), each optimized for its purpose.

**Q22: Why did you choose REST over GraphQL?**
A: The data shapes are well-defined and simple — straightforward CRUD operations on triage records. REST endpoints are easier to understand, test, and document. GraphQL's flexibility is more valuable when clients need custom query shapes, which isn't a strong requirement here.

**Q23: How is data consistency maintained?**
A: Zod validation ensures only valid data enters the database. Supabase PostgreSQL enforces column types and constraints. UUIDs as primary keys prevent ID conflicts. Timestamps are generated server-side (not client-side) preventing timezone inconsistencies.

**Q24: What would you add if you had more time?**
A: 
1. Real ML model trained on historical triage data for pattern recognition
2. Mobile app for paramedics (React Native)
3. Role-based authentication — doctor vs nurse vs admin views
4. SMS/push alerts when a CRITICAL patient arrives
5. Multi-language support (Tamil, Hindi, Telugu) for government hospital use
6. Integration with hospital HMIS (Hospital Management Information System)

**Q25: What were the most challenging parts of building this?**
A: 
1. **Handling the Render cold-start problem** — the backend sleeps on free tier, causing the first request to fail. Solved with increased timeout (70s), auto-retry logic, and a user-facing status banner.
2. **Score overflow bug** — the symptom scoring didn't cap scores, so a patient with both chest pain (35pts) and seizure (38pts) would get 73/40 — which is impossible. Fixed with `Math.min(score, 40)`.
3. **TypeScript type safety across the full stack** — ensuring the backend response exactly matched the frontend types required careful interface design.

---

## 11. LIVE LINKS

| Resource | URL |
|----------|-----|
| Frontend (Live App) | https://vital-edge-wine.vercel.app |
| Backend Health Check | https://vital-edge-backend.onrender.com/health |
| GitHub Repository | https://github.com/vinay-2006/Vital-Edge |

---

## 12. HOW TO DEMO (Step by Step)

1. Open https://vital-edge-wine.vercel.app
2. Wait for the green "Server is online" banner to appear (may take 30–60 sec if cold start)
3. Fill in the Triage Input page:
   - Name: any name
   - Age: 65, Gender: Male
   - BP: 170/100, Pulse: 130, Temp: 38.5, SpO2: 87, RR: 28
   - Check: Chest Pain ✓, Breathlessness ✓
   - Mode: AMBULANCE, ETA: 10 minutes
4. Click "Analyze Patient"
5. Show the CRITICAL result, confidence %, explainability section, risk assessment
6. Show the preparation notes for staff
7. Navigate to Dashboard → show the bar chart and entries table
8. Click "Export CSV" to demonstrate data export

---

*Document generated for Vital-Edge Presentation — April 2026*
