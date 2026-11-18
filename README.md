# MediSync 🏥💊
### Intelligent Medicine Reminder & Treatment Adherence Tracker

> A patient-friendly, intelligent medicine management platform engineered to maximize prescription adherence, eliminate missed doses through automated caregiver escalation, provide multilingual voice assistance, and predict medicine stock refills.

---

## 🌟 Overview

**MediSync** is not just an ordinary alarm or reminder app. It is a comprehensive healthcare adherence platform designed for patients managing chronic conditions, elderly individuals who need intuitive assistance, and family caregivers who need peace of mind.

MediSync bridges the gap between doctors' prescriptions and daily patient compliance by providing:
1. **Prescription OCR Auto-Scanner** to snap or upload doctor's prescriptions and automatically extract and schedule medicines.
2. **Intelligent Reminders & Scheduling** with stateful dose tracking (Taken / Skipped / Missed).
3. **Automated Missed-Dose Escalation** that notifies linked caregivers when a dose remains untaken past the configured grace period.
4. **Multilingual Voice Assistant** supporting English, Hindi (हिंदी), and Marathi (मराठी) for accessible voice interactions.
5. **Predictive Inventory Management** that dynamically forecasts stock depletion dates based on actual confirmed consumption.
6. **Adherence Analytics & Weekly PDF Reports** providing actionable healthcare insights for clinical visits.

---

## 🚀 Key Features

### 1. 📷 Optical Prescription Scanner & Auto-Add (OCR)
- **Camera & Image Upload**: Snap live photos using your device camera, drag-and-drop prescription scans, or paste from clipboard (Ctrl+V).
- **Intelligent Medical Entity Parsing**: Automatically identifies medicine names, dosages (mg/ml), forms (Tablet, Capsule, Syrup, Drops, Inhaler), intake slots (`1-0-1`, `1-1-1`, `BD`, `TDS`, `HS`), and food timing (`Before Food`, `After Food`, `Empty Stomach`).
- **Clinical Review & Edit**: Users can review and adjust recognized medicines, adjust quantities, toggle daily timeslots, and commit everything with a single click.
- **Built-in 1-Click Demo Prescriptions**: Try realistic sample prescriptions (Fever & Antibiotics, Cardio-Diabetic Care, Pain & Acidity) instantly without needing a physical prescription.
- **Batch API Insertion**: Adds multiple medicines in a single atomic transaction and generates today's dose logs immediately.

### 2. ⏰ Smart Medicine Scheduler & Real-Time Reminders
- Add medicines with dosage, medicine form (Tablets, Capsules, Syrup, Injection, Drops, Inhaler), food instructions (Before Food, After Food, With Food, Empty Stomach).
- Set intake timings across standard slots: Morning, Afternoon, Evening, and Night, or custom timestamps.
- Flexible recurrence: Daily, Specific Days of the Week, Interval Days, or Custom Date Ranges.
- Stateful dose management: Real-time status update to **Taken**, **Skipped**, or **Missed**.
- Browser Web Notifications API integration with audio cues and persistent service-level reminder triggers.

### 2. 🚨 Intelligent Missed-Dose Detection & Caregiver Escalation
- Automated background worker evaluates dose states against scheduled time + grace period.
- Two-stage escalation protocol:
  - **T+0 min**: Scheduled reminder alert.
  - **T+15 min**: Gentle follow-up alert if unconfirmed.
  - **T+Grace (e.g. 30–60 min)**: Dose auto-transitions to `Missed`.
- Immediate caregiver notification via in-app notification center and dashboard alert badges.
- Strict medical safety: **No double-dosing or compensatory extra dose recommendations.**

### 3. 🎙️ Multilingual Voice-Based Medicine Assistant
- Designed specifically for elderly and visually challenged patients.
- Supports **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
- Hands-free voice commands:
  - *"What medicines do I need to take today?"* / *"आज मुझे कौन सी दवाएं लेनी हैं?"* / *"मला आज कोणती औषधे घ्यायची आहेत?"*
  - *"I have taken my medicine"* / *"मैंने अपनी दवा ले ली है"* / *"मी माझे औषध घेतले आहे"*
  - *"What is my next medicine?"* / *"मेरी अगली दवा कौन सी है?"*
- Safety First: Assistant identifies corresponding pending dose and requests explicit user confirmation before recording. Fallback text input provided.

### 4. 📦 Medicine Stock Management & Refill Prediction
- Tracks inventory count (tablets, capsules, ml, units).
- Consumption velocity calculated purely from **confirmed Taken doses** (never deducted for missed/skipped doses).
- Smart metrics:
  - Current Available Stock
  - Daily Consumption Rate
  - Estimated Remaining Days
  - Predicted Refill Date
- Automated Low-Stock warning badges when stock falls below 5 days of runway.

### 5. 📊 Adherence Analytics & Exportable Weekly Reports
- Adherence calculation:
  $$\text{Adherence Rate (\%)} = \left(\frac{\text{Taken Doses}}{\text{Total Scheduled Doses}}\right) \times 100$$
- Visual charts (powered by Recharts):
  - Weekly compliance trend graphs.
  - Time-of-day adherence (Morning vs. Afternoon vs. Evening vs. Night).
  - Medicine-wise compliance breakdown.
  - Taken vs. Skipped vs. Missed distribution.
- One-click **Export Weekly Report as PDF** formatted for clinical review by doctors.

### 6. 👥 Dual Role Architecture: Patient & Caregiver Portals
- **Patient Dashboard**: Daily medication roadmap, quick dose toggles, voice assistant, stock meters, adherence metrics.
- **Caregiver Dashboard**: Multi-patient monitoring hub, live activity feed, real-time missed-dose alerts, low-stock warnings, and patient reports.
- **Secure Pairing**: Patients generate unique 6-character Caregiver Pairing Codes. Caregivers can only link and view data after explicit authorization.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React.js (Vite), Tailwind CSS, Lucide React Icons |
| **Optical OCR & Parsing** | Tesseract.js, Clinical Rx Regular Expression & Entity Extraction Engine |
| **Data Visualization** | Recharts (Responsive Line, Bar, and Pie Charts) |
| **Voice & Speech** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) with localized grammar parsers |
| **Document Export** | jsPDF & html2canvas for clinical PDF generation |
| **Backend API** | Node.js, Express.js, RESTful Architecture |
| **Database & ORM** | SQLite with WAL mode (`better-sqlite3` / `sqlite3`) / PostgreSQL-ready schema |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, Role-Based Access Control |
| **Notifications** | HTML5 Web Notifications API + Local Sound Alerts |

---

## 📂 Project Directory Structure

```text
ycce/
├── README.md                      # Comprehensive Project Documentation
├── PRD.md                         # Detailed Product Requirements Document
├── TECHSTACK.md                   # Technical Architecture & Stack Specifications
├── server/                        # Express.js REST API Backend
│   ├── config/                    # Database connection & environment configuration
│   ├── controllers/               # Business logic (auth, medicines, doses, caregivers, etc.)
│   ├── middleware/                # JWT verification, RBAC, error handlers
│   ├── models/                    # Database schemas, migrations & seed scripts
│   ├── routes/                    # API route definitions
│   ├── services/                  # Dose scheduler, missed-dose detector, stock predictor
│   ├── package.json
│   └── server.js                  # Express server entry point
└── client/                        # Modern React Single Page Application
    ├── public/                    # Static assets, notification sounds
    ├── src/
    │   ├── assets/                # Logos, icons, illustrations
    │   ├── components/            # Reusable UI components (Modals, Cards, Badges, Sidebar)
    │   ├── context/               # AuthContext, NotificationContext, LanguageContext
    │   ├── hooks/                 # Custom hooks (useSpeech, useNotifications, useDoses)
    │   ├── pages/                 # Patient & Caregiver dashboards, Inventory, Reports, Settings
    │   ├── services/              # Axios/Fetch API client layer
    │   ├── utils/                 # Date formatters, adherence calculators, voice interpreters
    │   ├── App.jsx                # Route definitions & guards
    │   ├── index.css              # Tailwind CSS directives
    │   └── main.jsx               # React DOM entry
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24.x)
- **npm**: v9.0.0 or higher

### Step 1: Clone or Navigate to Directory
```bash
cd c:\Users\DELL\Desktop\ycce
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Seed Database with Realistic Demo Data
```bash
npm run seed
```

### Step 4: Start Backend Server
```bash
npm run dev
# Backend starts at: http://localhost:5000
```

### Step 5: Install Frontend Dependencies & Run
Open a new terminal:
```bash
cd client
npm install
npm run dev
# Frontend starts at: http://localhost:5173
```

---

## 🔑 Demo Login Credentials

For testing and demonstration, use the following pre-seeded accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Patient** | `patient@medisync.com` | `patient123` | Active schedule with 4 medicines, demo adherence data, linked caregiver |
| **Caregiver** | `caregiver@medisync.com` | `caregiver123` | Linked to demo patient, receives missed-dose alerts & stock notifications |
| **New Patient** | `senior.user@medisync.com` | `senior123` | Clean account for testing onboarding & voice assistant |

> **Caregiver Pairing Code for Demo Patient**: `SM-7894`

---

## 🩺 Medical Safety & Clinical Compliance

1. **No Dosage Modification**: The system strictly prohibits automated dosage alterations. All doses and frequencies must reflect certified physician instructions.
2. **No Double-Dose Recommendations**: If a dose is missed, MediSync explicitly informs the user: *"Take your next dose at the regular scheduled time. Do not double your dose."*
3. **Audit Trail**: Any manual dose status change (e.g., marked taken retroactively) preserves an immutable timestamped log.
4. **Data Isolation**: Patients retain full sovereignty over their health data. Caregivers can only access records upon explicit code redemption and authorization.

---

## 📄 License
This project is developed for healthcare management research and demonstration purposes. MIT License.

