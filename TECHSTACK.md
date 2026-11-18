# Technical Architecture & Technology Stack Specification (TECHSTACK.md)
# MediSync – Intelligent Medicine Reminder & Treatment Adherence Tracker

---

## 1. Architectural Overview

MediSync follows a decoupled client-server architecture engineered for high availability, low latency, robust data isolation, and accessibility across modern web browsers.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (React 18 + Vite)                  │
│                                                                        │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │ Patient Dashboard  │   │ Caregiver Portal   │   │ Voice Engine │   │
│   └────────────────────┘   └────────────────────┘   └──────────────┘   │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │ Recharts Analytics │   │ jsPDF Report Gen   │   │ Web Notifs   │   │
│   └────────────────────┘   └────────────────────┘   └──────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST API / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Application Layer (Node.js + Express)              │
│                                                                        │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │ Auth & RBAC Guard  │   │ Scheduler Service  │   │ Missed Dose  │   │
│   └────────────────────┘   └────────────────────┘   │ Worker Engine│   │
│   ┌────────────────────┐   ┌────────────────────┐   └──────────────┘   │
│   │ Stock Calculator   │   │ Caregiver Dispatch │   ┌──────────────┐   │
│   └────────────────────┘   └────────────────────┘   │ Audit Logger │   │
│                                                     └──────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL Query Interface (Parameterized)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Data Persistence Layer                            │
│                                                                        │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐   │
│   │ SQLite (WAL mode)  │   │ Relational Schema  │   │ Encrypted    │   │
│   │ / PostgreSQL Ready │   │ & Constraints      │   │ Passwords    │   │
│   └────────────────────┘   └────────────────────┘   └──────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Technology Stack

| Component | Technology | Version | Purpose & Rationale |
|---|---|---|---|
| **Core Framework** | React.js | `^18.3.0` | Declarative, component-driven UI with optimized hook state management. |
| **Build Tool** | Vite | `^6.0.0` | Ultra-fast HMR (Hot Module Replacement) and optimized production bundling. |
| **Styling & Design System** | Tailwind CSS | `^3.4.0` | Modern, responsive healthcare UI with custom medical palette (`teal`, `cyan`, `sky`, `slate`). |
| **Iconography** | Lucide React | `^0.460.0` | Clean, crisp, lightweight icons for healthcare metaphors (pills, calendar, alerts, heart). |
| **Data Visualizations** | Recharts | `^2.13.0` | Responsive SVG-based charting for adherence trends, weekly distributions, and time slots. |
| **Voice Processing** | Web Speech API | Native Browser | Native `SpeechRecognition` / `SpeechSynthesis` for zero-latency multilingual voice interactions. |
| **PDF Generation** | jsPDF & html2canvas | `^2.5.0` & `^1.4.0` | Client-side clinical adherence report generation with charts and tables. |
| **State & Context** | React Context API | Native | Centralized management for `AuthContext`, `NotificationContext`, and `LanguageContext`. |
| **HTTP Client** | Axios / Fetch API | Standard | REST communication with token interceptors and error handling. |

---

## 3. Backend Technology Stack

| Component | Technology | Version | Purpose & Rationale |
|---|---|---|---|
| **Runtime Environment** | Node.js | `>= 18.0.0` (v24.x) | High-throughput asynchronous event-driven I/O. |
| **Web Server Framework** | Express.js | `^4.21.0` | Robust middleware ecosystem, clean routing, and JSON request handling. |
| **Database Engine** | SQLite3 / Better-SQLite3 | `^5.1.0` / `^11.0.0` | Zero-configuration, atomic ACID persistence with Write-Ahead Logging (WAL) for high concurrency. Compatible with PostgreSQL migration. |
| **Authentication & Tokens** | JSON Web Token (`jsonwebtoken`) | `^9.0.0` | Stateless token-based security passing user identity and role scopes. |
| **Password Hashing** | `bcryptjs` | `^2.4.3` | Cryptographic salt-and-hash protecting stored credentials. |
| **CORS Management** | `cors` | `^2.8.5` | Secure cross-origin resource sharing between React frontend and Express API. |
| **Scheduling Engine** | `node-cron` / Interval Worker | `^3.0.3` | Periodic background worker that scans for overdue doses and initiates caregiver alerts. |

---

## 4. Database Architecture & Schema Design

### 4.1 Schema DDL & Relationships

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('PATIENT', 'CAREGIVER')),
  phone TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en', 'hi', 'mr')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Patient Profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  pairing_code TEXT UNIQUE,
  pairing_code_expires_at DATETIME,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_group TEXT,
  allergies TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Caregiver Relationships
CREATE TABLE IF NOT EXISTS caregiver_relationships (
  id TEXT PRIMARY KEY,
  caregiver_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('PENDING', 'ACTIVE', 'REVOKED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(caregiver_id, patient_id)
);

-- Medicines Catalog
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  form TEXT NOT NULL CHECK(form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'INHALER', 'OTHER')),
  food_instruction TEXT NOT NULL CHECK(food_instruction IN ('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'EMPTY_STOMACH', 'NO_RESTRICTION')),
  color_tag TEXT DEFAULT '#0d9488',
  instructions TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_chronic INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Medication Schedules
CREATE TABLE IF NOT EXISTS medication_schedules (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  time_slot TEXT NOT NULL CHECK(time_slot IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'CUSTOM')),
  scheduled_time TEXT NOT NULL, -- '08:00', '13:00', etc.
  dosage_quantity REAL DEFAULT 1.0,
  recurrence_type TEXT DEFAULT 'DAILY' CHECK(recurrence_type IN ('DAILY', 'DAYS_OF_WEEK', 'INTERVAL')),
  days_of_week TEXT, -- JSON Array: ["MON", "WED"]
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

-- Scheduled Doses
CREATE TABLE IF NOT EXISTS scheduled_doses (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  dose_date TEXT NOT NULL, -- 'YYYY-MM-DD'
  scheduled_time TEXT NOT NULL, -- 'HH:MM'
  status TEXT DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'TAKEN', 'SKIPPED', 'MISSED')),
  taken_at DATETIME,
  skipped_reason TEXT,
  reminder_sent_count INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES medication_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(medicine_id, schedule_id, dose_date, scheduled_time)
);

-- Medicine Inventory
CREATE TABLE IF NOT EXISTS medicine_inventory (
  id TEXT PRIMARY KEY,
  medicine_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  current_stock REAL NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'tablets',
  low_stock_threshold REAL DEFAULT 5,
  last_refill_date DATE,
  last_refill_quantity REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications & Caregiver Alerts
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  patient_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('REMINDER', 'FOLLOW_UP', 'MISSED_DOSE', 'LOW_STOCK', 'CAREGIVER_ALERT')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dose Audit Log
CREATE TABLE IF NOT EXISTS dose_audit_log (
  id TEXT PRIMARY KEY,
  dose_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  reason TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dose_id) REFERENCES scheduled_doses(id) ON DELETE CASCADE
);
```

---

## 5. Core Algorithmic Engines

### 5.1 Dose State Machine & Missed-Dose Escalation Engine

```text
               ┌───────────────┐
               │   SCHEDULED   │
               └───────┬───────┘
                       │ Scheduled Time arrives (T+0m)
                       ▼
               ┌───────────────┐
               │      DUE      │ ──► Send Browser Web Notification
               └───────┬───────┘
                       │
       ┌───────────────┼───────────────┐
       │ T+15m         │ Patient clicks│ Patient clicks
       │ unconfirmed   │ "Mark Taken"  │ "Skip Dose"
       ▼               ▼               ▼
┌──────────────┐ ┌───────────┐   ┌───────────┐
│  FOLLOW-UP   │ │   TAKEN   │   │  SKIPPED  │
│  ALERT SENT  │ │(Stock -1) │   │(Stock = ) │
└──────┬───────┘ └───────────┘   └───────────┘
       │
       │ T+Grace Period (e.g. 45m elapsed)
       ▼
┌──────────────┐
│    MISSED    │ ──► Stock untouched
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ CAREGIVER ALERT DISPATCHED     │
│ - Notification inserted        │
│ - Caregiver dashboard updated  │
│ - Safety rule: NO double dose  │
└────────────────────────────────┘
```

### 5.2 Stock Depletion & Refill Prediction Engine

```javascript
/**
 * Computes remaining days and predicted refill date
 * @param {number} currentStock - Available units in inventory
 * @param {Array} schedules - Active medication schedules for the drug
 * @returns {Object} { dailyConsumption, daysRemaining, refillDate, isLowStock }
 */
function calculateStockProjection(currentStock, schedules) {
  const dailyConsumption = schedules.reduce((acc, sch) => acc + (sch.dosage_quantity || 1), 0);
  
  if (dailyConsumption <= 0) {
    return { dailyConsumption: 0, daysRemaining: Infinity, refillDate: null, isLowStock: false };
  }

  const daysRemaining = Math.floor(currentStock / dailyConsumption);
  const refillDate = new Date();
  refillDate.setDate(refillDate.getDate() + daysRemaining);

  return {
    dailyConsumption,
    daysRemaining,
    refillDate: refillDate.toISOString().split('T')[0],
    isLowStock: daysRemaining <= 5
  };
}
```

### 5.3 Multilingual Voice Intent Engine

The client-side voice processor matches transcripts using normalized regex tokenizers tailored for English, Hindi, and Marathi phonetics:

```javascript
const VOICE_GRAMMAR = {
  QUERY_TODAY: [
    /what.*medicines?.*today/i,
    /today.*medicines?/i,
    /schedule.*today/i,
    /आज.*दवा/i,
    /आज.*गोळ्या/i,
    /कोणती.*औषधे/i
  ],
  MARK_TAKEN: [
    /i.*taken.*medicine/i,
    /took.*medicine/i,
    /mark.*taken/i,
    /मैंने.*दवा.*ली/i,
    /दवा.*खा.*ली/i,
    /मी.*औषध.*घेतले/i,
    /गोळी.*घेतली/i
  ],
  QUERY_NEXT: [
    /what.*next.*medicine/i,
    /next.*dose/i,
    /अगली.*दवा/i,
    /पुढचे.*औषध/i
  ]
};
```

---

## 6. API Route Contracts

### 6.1 Authentication (`/api/auth`)
* `POST /api/auth/register` - Create patient or caregiver account.
* `POST /api/auth/login` - Authenticate and return JWT token + user profile.
* `GET /api/auth/me` - Validate session and retrieve current user context.

### 6.2 Medicines & Scheduling (`/api/medicines`)
* `GET /api/medicines` - List patient's medicines and schedules.
* `POST /api/medicines` - Register new medicine with daily slots.
* `PUT /api/medicines/:id` - Update medicine dosage/instructions.
* `DELETE /api/medicines/:id` - Archive or remove medicine.

### 6.3 Doses & Reminders (`/api/doses`)
* `GET /api/doses/today` - Retrieve today's scheduled doses with active statuses.
* `POST /api/doses/:id/status` - Update dose status (`TAKEN`, `SKIPPED`, `MISSED`).
* `POST /api/doses/sync` - Synchronize and trigger automated missed-dose checks.
* `GET /api/doses/history` - Historical dose records with filtering.

### 6.4 Inventory (`/api/inventory`)
* `GET /api/inventory` - Get all medicines with current stock and refill forecasts.
* `POST /api/inventory/:medicineId/refill` - Add purchased units to stock.

### 6.5 Analytics & Reports (`/api/analytics`)
* `GET /api/analytics/adherence` - Calculate weekly/monthly adherence rates and slot distributions.
* `GET /api/analytics/weekly-report` - Payload optimized for client-side PDF rendering.

### 6.6 Caregiver & Pairing (`/api/caregiver`)
* `POST /api/caregiver/generate-code` - Generate 6-char pairing code for patient.
* `POST /api/caregiver/link-patient` - Caregiver links patient via pairing code.
* `GET /api/caregiver/patients` - Caregiver fetches all authorized linked patients.
* `GET /api/caregiver/patients/:id/overview` - Caregiver accesses specific patient adherence and alerts.

---

## 7. Environment Configuration (`.env.example`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=smartmedi_super_secret_clinical_grade_jwt_key_2026

# Database Configuration
DATABASE_URL=./smartmedi.sqlite

# Escalation Configuration
GRACE_PERIOD_MINUTES=45
FOLLOW_UP_INTERVAL_MINUTES=15

# Client Origin
CLIENT_ORIGIN=http://localhost:5173
```

---

## 8. Deployment & Execution Plan

1. **Backend Initialization**: Express setup with SQLite connection, migrations, seed data generator, and routes.
2. **Frontend Initialization**: Vite + React 18, Tailwind CSS, Lucide icons, Recharts, jsPDF.
3. **Core Modules Integration**:
   - Medication Scheduler & Dose generator
   - Missed Dose Escalation Engine & Caregiver Alert System
   - Multilingual Voice Assistant (EN / HI / MR)
   - Stock Management & Refill Predictor
   - Adherence Analytics & PDF Export
4. **End-to-End Verification**: Validate every user flow across Patient and Caregiver roles with realistic demo credentials.

