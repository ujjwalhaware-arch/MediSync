# Product Requirements Document (PRD)
# MediSync – Intelligent Medicine Reminder & Treatment Adherence Tracker

* **Document Version:** 1.0.0
* **Status:** Approved for Implementation
* **Target Audience:** Engineering, Clinical Advisors, UX/UI Designers, Stakeholders

---

## 1. Executive Summary & Product Vision

### 1.1 Executive Summary
Non-adherence to prescribed medication regimens is one of the leading causes of avoidable hospital readmissions, therapeutic complications, and escalating healthcare expenditures worldwide. Conventional reminder applications function merely as alarms without contextual awareness, fail to detect missed doses automatically, do not involve family caregivers in the loop, and pose significant usability barriers for elderly or non-English-speaking patients.

**MediSync** is an intelligent, patient-centric medication adherence ecosystem. It couples real-time scheduled reminders with automated missed-dose detection, caregiver notification escalation, a trilingual voice assistant (English, Hindi, Marathi), dynamic stock depletion forecasting, and clinical-grade adherence analytics.

### 1.2 Vision Statement
To empower chronic patients and senior citizens to achieve maximum medication compliance with zero friction, while providing remote caregivers with transparent, actionable peace of mind.

---

## 2. Target Personas & User Journeys

### 2.1 Persona A: Chronic Patient / Senior Citizen (Ramesh, 68)
* **Profile:** Diagnosed with hypertension and type-2 diabetes; takes 4 different medications daily at varying times.
* **Pain Points:** Frequently forgets midday tablets; struggles to read tiny text on mobile screens; prefers communicating in Hindi or Marathi.
* **MediSync Solution:** Voice assistant allows him to ask in Hindi *"आज मुझे कौन सी दवाएं लेनी हैं?"* and confirm doses via voice; large, accessible cards with color-coded morning/afternoon/night badges.

### 2.2 Persona B: Remote Family Caregiver (Priya, 34)
* **Profile:** Lives in another city while her elderly parents live independently.
* **Pain Points:** Constantly anxious about whether her father took his blood pressure medicine on time; relies on calling him multiple times daily.
* **MediSync Solution:** Receives automated escalation alerts when a dose is missed past the grace period; views real-time adherence progress and low-stock warnings from the Caregiver Dashboard.

### 2.3 Persona C: Attending Physician / Clinician (Dr. Kulkarni)
* **Profile:** Primary care physician managing chronic patients during monthly checkups.
* **Pain Points:** Relies on inaccurate patient memory regarding whether prescriptions were followed reliably.
* **MediSync Solution:** One-click weekly/monthly adherence PDF report showing exact compliance percentage, missed-dose patterns, and time-slot distributions.

---

## 3. Core Functional Requirements & Feature Specifications

### 3.1 Feature 1: Smart Medicine Scheduler & Reminder System

#### 3.1.1 Medicine Prescription Onboarding
* Patients can create, view, edit, and archive medicines with the following attributes:
  * **Medicine Name** (e.g., Metformin 500mg, Amlodipine 5mg).
  * **Dosage Unit & Strength** (e.g., 1 tablet, 5 ml, 2 drops, 1 puff).
  * **Medicine Type** (Tablets, Capsules, Syrup, Injection, Drops, Inhaler, Topical).
  * **Food Relation** (Before Food, After Food, With Food, Empty Stomach).
  * **Color / Visual Tag** for quick visual identification.
  * **Start Date and End Date** (or ongoing chronic treatment).

#### 3.1.2 Time Slots & Schedule Patterns
* Support standard medical slots:
  * **Morning** (Default: 08:00 AM)
  * **Afternoon** (Default: 01:00 PM)
  * **Evening** (Default: 07:00 PM)
  * **Night** (Default: 10:00 PM)
  * Custom time picker for specific intervals.
* Schedule recurrence:
  * Daily (Every day).
  * Specific Days of the Week (e.g., Mon, Wed, Fri).
  * Day intervals (e.g., Every 2 days).

#### 3.1.3 Dose Generation & Real-Time Actions
* Automatic generation of daily `ScheduledDose` instances.
* Dose state transitions:
  * `SCHEDULED` (Pending future time).
  * `DUE` (Within current active reminder window).
  * `TAKEN` (Patient marked as consumed; records timestamp).
  * `SKIPPED` (Patient deliberately skipped with optional reason).
  * `MISSED` (Grace period elapsed without confirmation).
* Immediate browser Web Notification triggered when dose becomes due, with sound alert and action buttons (`Mark Taken`, `Snooze 10m`, `Skip`).

---

### 3.2 Feature 2: Intelligent Missed-Dose Detection & Caregiver Escalation

#### 3.2.1 Two-Stage Escalation Protocol
1. **Stage 1 (Due Alert - T+0m):**
   * Primary notification delivered to patient device.
2. **Stage 2 (Gentle Follow-Up - T+15m):**
   * If dose remains unmarked after 15 minutes, a secondary audio/browser prompt is dispatched: *"Reminder: Your scheduled dose for [Medicine] is still waiting."*
3. **Stage 3 (Escalation to Missed & Caregiver Alert - T+Grace Period, default 30–60 min):**
   * Background verification worker marks dose status as `MISSED`.
   * Real-time notification dispatched to all linked caregivers:
     *"Alert: Patient [Patient Name] has missed their scheduled dose of [Medicine Name] at [Scheduled Time]."*
   * Activity log and caregiver dashboard updated instantly.

#### 3.2.2 Medical Safety Compliance
* **Strict Prohibition of Double Doses:** The application explicitly warns:
  > *"Do not take an extra dose or double your next scheduled dose. Please resume your normal schedule or consult your physician."*
* Users may correct an erroneous `MISSED` or `SKIPPED` status retroactively, but an immutable audit trail (`DoseAuditLog`) records the correction timestamp and prior status.
* **Emergency Escalation**: MediSync automatically alerts connected caregivers.

---

### 3.3 Feature 3: Multilingual Voice-Based Medicine Assistant

#### 3.3.1 Language Support
* **English** (`en-US` / `en-IN`)
* **Hindi** (`hi-IN`)
* **Marathi** (`mr-IN`)

#### 3.3.2 Voice Interaction Architecture
* Powered by browser Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) with native `SpeechSynthesis`.
* Graceful fallback to text-based chat/command interface when microphone permissions are denied or unsupported.

#### 3.3.3 Core Voice Intention Matrix
| Intent | English Command Example | Hindi Command Example | Marathi Command Example | System Action |
|---|---|---|---|---|
| **Query Today's Doses** | *"What medicines do I need to take today?"* | *"आज मुझे कौन सी दवाएं लेनी हैं?"* | *"मला आज कोणती औषधे घ्यायची आहेत?"* | Queries database for today's doses and speaks formatted list with timings and food instructions. |
| **Mark Dose as Taken** | *"I have taken my morning medicine."* | *"मैंने अपनी सुबह की दवा ले ली है।"* | *"मी माझी सकाळची औषध घेतली आहे."* | Matches pending dose, speaks confirmation dialog: *"Confirm marking [Medicine] as taken?"*, executes update upon positive reply. |
| **Query Next Dose** | *"What is my next medicine?"* | *"मेरी अगली दवा कौन सी है?"* | *"माझे पुढचे औषध कोणते आहे?"* | Identifies immediate next upcoming scheduled dose and remaining time. |
| **Check Inventory** | *"How much medicine is left?"* | *"मेरी दवा कितनी बची है?"* | *"माझे किती औषध शिल्लक आहे?"* | Reports low-stock medicines and days remaining. |

#### 3.3.4 Medical Boundaries for Voice Assistant
* The assistant is hard-scoped to the patient's existing prescription records.
* Under no circumstances does the assistant provide medical diagnosis, drug interaction assessments, or off-label recommendations.

---

### 3.4 Feature 4: Medicine Stock Management & Refill Prediction

#### 3.4.1 Inventory Tracking Mechanics
* Patients input purchased pack count (e.g., 30 tablets, 60 capsules).
* **Inventory Deduction Rule:** Inventory is deducted **only** upon a confirmed `TAKEN` dose. It is strictly never decremented for `MISSED` or `SKIPPED` doses.
* Manual adjustment option with audit reason (e.g., *"Purchased new strip of 15 tablets"*).

#### 3.4.2 Predictive Depletion Algorithm
* **Daily Consumption Velocity ($C_{daily}$):** Total scheduled units required per 24-hour cycle.
* **Estimated Remaining Days ($D_{remain}$):**
  $$D_{remain} = \left\lfloor \frac{\text{Current Available Stock}}{C_{daily}} \right\rfloor$$
* **Expected Refill Date ($T_{refill}$):**
  $$T_{refill} = \text{Current Date} + D_{remain} \text{ days}$$
* **Threshold Triggers:**
  * **Normal (Green):** $D_{remain} > 7\text{ days}$.
  * **Low Stock Warning (Amber):** $3 \le D_{remain} \le 7\text{ days}$.
  * **Critical Stock Alert (Red):** $D_{remain} < 3\text{ days}$.

---

### 3.5 Feature 5: Adherence Analytics & Clinical Reports

#### 3.5.1 Adherence Formula
$$\text{Adherence Rate (\%)} = \left( \frac{\text{Confirmed Taken Doses}}{\text{Total Scheduled Doses}} \right) \times 100$$
* *Note:* `SKIPPED` doses are categorized independently and are **not** treated as taken doses.

#### 3.5.2 Analytics Visualizations
* **7-Day & 30-Day Adherence Trends:** Interactive Recharts line chart showing daily adherence percentage against a recommended 85%+ clinical benchmark.
* **Dose Status Distribution:** Pie/Donut chart illustrating relative proportion of `Taken`, `Skipped`, and `Missed` doses.
* **Time-of-Day Compliance:** Bar chart comparing adherence across Morning, Afternoon, Evening, and Night slots to pinpoint when the patient is most vulnerable to forgetting.
* **Medicine-Wise Scorecard:** Granular compliance table identifying problematic medications.

#### 3.5.3 Clinical PDF Report Export
* Generates a clean, branded PDF summary containing:
  * Patient demographic information & primary diagnosis.
  * Prescribed medicines active during the period.
  * Overall Adherence Score (%) with clinical indicator (Excellent, Moderate, Low).
  * Comprehensive log of missed doses and reasons.
  * Physician notes & signature section for clinical consultation.

---

### 3.6 Feature 6: Role-Based Access & Patient-Caregiver Pairing

#### 3.6.1 Pairing Protocol
1. Patient navigates to **Caregiver Settings** and clicks *"Generate Pairing Code"*.
2. System produces a cryptographically random 6-character code (e.g., `SM-8492`) valid for 48 hours.
3. Caregiver enters code into their portal under *"Add New Patient"*.
4. System links caregiver ID to patient ID in the `CaregiverRelationships` table with `status = 'ACTIVE'`.
5. Patient receives notification confirming caregiver connection and retains the right to revoke access at any time.

#### 3.6.2 Caregiver Dashboard Capabilities
* Multi-patient switcher.
* Real-time incident banner (e.g., *"Ramesh missed Metformin 500mg at 1:00 PM today"*).
* Live view of today's progress bar.
* Emergency contact shortcuts.
* Shared access to download weekly adherence PDF reports.

---

## 4. Non-Functional Requirements

### 4.1 Security & Privacy
* Passwords hashed using `bcryptjs` with a work factor of 10.
* JWT bearer token authorization with expiration and token renewal.
* SQL injection prevention via parameterized queries.
* Strict tenant data isolation: All queries enforce `WHERE user_id = :userId` or verify active caregiver relationship.

### 4.2 Reliability & Offline Capability
* Local state caching for active schedules.
* Graceful handling of browser notification permission states (Prompt, Granted, Denied).

### 4.3 Accessibility & Responsive Design
* Mobile-first responsive layout (Fluid from 360px mobile viewports to 4K ultra-wide monitors).
* High-contrast healthcare color palette meeting WCAG 2.1 AA standards.
* Touch-friendly targets (minimum 44x44px for elderly finger tap ergonomics).

---

## 5. System Architecture & Database Schema

### 5.1 Relational Schema Diagram (Entity Relationship)

```text
[Users]
  ├── id (UUID/PK)
  ├── name, email, password_hash, role ('PATIENT' | 'CAREGIVER')
  ├── phone, preferred_language ('en' | 'hi' | 'mr')
  └── created_at

[PatientProfiles]
  ├── id (UUID/PK)
  ├── user_id (FK -> Users.id)
  ├── pairing_code, pairing_code_expires_at
  ├── emergency_contact_name, emergency_contact_phone
  └── blood_group, allergies, notes

[CaregiverRelationships]
  ├── id (UUID/PK)
  ├── caregiver_id (FK -> Users.id)
  ├── patient_id (FK -> Users.id)
  ├── status ('PENDING' | 'ACTIVE' | 'REVOKED')
  └── created_at

[Medicines]
  ├── id (UUID/PK)
  ├── user_id (FK -> Users.id)
  ├── name, dosage, form ('TABLET' | 'CAPSULE' | 'SYRUP' | etc.)
  ├── food_instruction ('BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'EMPTY_STOMACH')
  ├── start_date, end_date, is_chronic
  └── color_tag, instructions

[MedicationSchedules]
  ├── id (UUID/PK)
  ├── medicine_id (FK -> Medicines.id)
  ├── time_slot ('MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'CUSTOM')
  ├── scheduled_time ('HH:MM')
  ├── dosage_quantity (e.g. 1)
  ├── recurrence_type ('DAILY' | 'DAYS_OF_WEEK' | 'INTERVAL')
  └── days_of_week (JSON array, e.g. ["MON", "WED", "FRI"])

[ScheduledDoses]
  ├── id (UUID/PK)
  ├── medicine_id (FK -> Medicines.id)
  ├── schedule_id (FK -> MedicationSchedules.id)
  ├── user_id (FK -> Users.id)
  ├── dose_date ('YYYY-MM-DD')
  ├── scheduled_time ('HH:MM')
  ├── status ('SCHEDULED' | 'TAKEN' | 'SKIPPED' | 'MISSED')
  ├── taken_at (TIMESTAMP)
  ├── skipped_reason (TEXT)
  └── reminder_sent_count (INTEGER)

[MedicineInventory]
  ├── id (UUID/PK)
  ├── medicine_id (FK -> Medicines.id)
  ├── user_id (FK -> Users.id)
  ├── current_stock (INTEGER)
  ├── unit ('tablets' | 'capsules' | 'ml' | 'units')
  ├── low_stock_threshold (INTEGER)
  ├── last_refill_date (DATE)
  └── last_refill_quantity (INTEGER)

[Notifications]
  ├── id (UUID/PK)
  ├── user_id (FK -> Users.id)
  ├── type ('REMINDER' | 'FOLLOW_UP' | 'MISSED_DOSE' | 'LOW_STOCK' | 'CAREGIVER_ALERT')
  ├── title, message
  ├── is_read (BOOLEAN)
  └── metadata (JSON)
```

---

## 6. Verification & Quality Acceptance Criteria

1. **Scheduling Engine:** Adding a medicine with 2 daily slots (08:00 and 20:00) must immediately generate exact dose instances for the active window.
2. **Missed-Dose Automation:** When a dose is untouched past grace threshold, status switches from `SCHEDULED` to `MISSED`, and caregiver dashboard flags the incident within 5 seconds of sync.
3. **Voice Engine:** Saying *"मैंने अपनी दवा ले ली है"* in Hindi or *"What are my medicines today?"* in English successfully activates voice synthesis and handles dose confirmation dialogs.
4. **Inventory Engine:** Confirming a dose of 1 tablet decrements stock from 30 to 29; skipping or missing that dose leaves stock at 30.
5. **PDF Export:** Triggering report export delivers a formatted, printable PDF with adherence percentage, trend charts, and patient data.

