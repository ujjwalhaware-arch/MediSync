/**
 * MediSync Clinical Prescription Parser & Dictionary
 * Extracts structured medicine metadata from OCR raw text.
 */

export const KNOWN_DRUGS = [
  // Pain & Fever
  { name: 'Paracetamol', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Analgesic / Antipyretic', color: '#0d9488' },
  { name: 'Dolo 650', defaultDosage: '650mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Analgesic / Antipyretic', color: '#0d9488' },
  { name: 'Crocin', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Analgesic', color: '#0d9488' },
  { name: 'Ibuprofen', defaultDosage: '400mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'NSAID / Pain Relief', color: '#e11d48' },
  { name: 'Aceclofenac', defaultDosage: '100mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'NSAID / Anti-inflammatory', color: '#e11d48' },
  { name: 'Diclofenac', defaultDosage: '50mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'NSAID / Anti-inflammatory', color: '#e11d48' },
  { name: 'Combiflam', defaultDosage: '1 tablet', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Pain Relief', color: '#e11d48' },
  { name: 'Meftal Spas', defaultDosage: '1 tablet', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antispasmodic', color: '#e11d48' },

  // Antibiotics & Anti-infectives
  { name: 'Amoxicillin', defaultDosage: '500mg', form: 'CAPSULE', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Augmentin 625', defaultDosage: '625mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Azithromycin', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Cefixime', defaultDosage: '200mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Ciprofloxacin', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Levofloxacin', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Doxycycline', defaultDosage: '100mg', form: 'CAPSULE', defaultFood: 'AFTER_FOOD', category: 'Antibiotic', color: '#7c3aed' },
  { name: 'Metronidazole', defaultDosage: '400mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antiprotozoal / Antibiotic', color: '#7c3aed' },

  // Antacids & Gastrointestinal
  { name: 'Pantoprazole', defaultDosage: '40mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Proton Pump Inhibitor', color: '#2563eb' },
  { name: 'Pan-D', defaultDosage: '1 capsule', form: 'CAPSULE', defaultFood: 'BEFORE_FOOD', category: 'Antacid + Antiemetic', color: '#2563eb' },
  { name: 'Omeprazole', defaultDosage: '20mg', form: 'CAPSULE', defaultFood: 'BEFORE_FOOD', category: 'Proton Pump Inhibitor', color: '#2563eb' },
  { name: 'Rabeprazole', defaultDosage: '20mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Proton Pump Inhibitor', color: '#2563eb' },
  { name: 'Esomeprazole', defaultDosage: '40mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Proton Pump Inhibitor', color: '#2563eb' },
  { name: 'Domperidone', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Antiemetic', color: '#2563eb' },
  { name: 'Ondansetron', defaultDosage: '4mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Antiemetic', color: '#2563eb' },
  { name: 'Gelusil', defaultDosage: '10ml', form: 'SYRUP', defaultFood: 'AFTER_FOOD', category: 'Antacid Suspension', color: '#2563eb' },

  // Diabetes Care
  { name: 'Metformin', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'WITH_FOOD', category: 'Anti-diabetic', color: '#059669' },
  { name: 'Glimepiride', defaultDosage: '1mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Anti-diabetic', color: '#059669' },
  { name: 'Gliclazide', defaultDosage: '80mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Anti-diabetic', color: '#059669' },
  { name: 'Sitagliptin', defaultDosage: '100mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'DPP-4 Inhibitor', color: '#059669' },
  { name: 'Januvia', defaultDosage: '100mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Anti-diabetic', color: '#059669' },
  { name: 'Dapagliflozin', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'SGLT2 Inhibitor', color: '#059669' },
  { name: 'Empagliflozin', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'SGLT2 Inhibitor', color: '#059669' },

  // Cardiovascular & Hypertension
  { name: 'Telmisartan', defaultDosage: '40mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antihypertensive', color: '#dc2626' },
  { name: 'Amlodipine', defaultDosage: '5mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Calcium Channel Blocker', color: '#dc2626' },
  { name: 'Atorvastatin', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Cholesterol / Statin', color: '#dc2626' },
  { name: 'Rosuvastatin', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Cholesterol / Statin', color: '#dc2626' },
  { name: 'Losartan', defaultDosage: '50mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antihypertensive', color: '#dc2626' },
  { name: 'Metoprolol', defaultDosage: '25mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Beta-Blocker', color: '#dc2626' },
  { name: 'Aspirin', defaultDosage: '75mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antiplatelet', color: '#dc2626' },
  { name: 'Ecosprin 75', defaultDosage: '75mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antiplatelet', color: '#dc2626' },

  // Allergy & Respiratory
  { name: 'Cetirizine', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antihistamine', color: '#d97706' },
  { name: 'Levocetirizine', defaultDosage: '5mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Antihistamine', color: '#d97706' },
  { name: 'Montelukast', defaultDosage: '10mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Anti-allergy / Bronchodilator', color: '#d97706' },
  { name: 'Montair-LC', defaultDosage: '1 tablet', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Anti-allergy', color: '#d97706' },
  { name: 'Allegra', defaultDosage: '120mg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Antihistamine', color: '#d97706' },
  { name: 'Ascoril', defaultDosage: '5ml', form: 'SYRUP', defaultFood: 'AFTER_FOOD', category: 'Cough Syrup', color: '#d97706' },
  { name: 'Asthalin', defaultDosage: '2 puffs', form: 'INHALER', defaultFood: 'AFTER_FOOD', category: 'Bronchodilator', color: '#d97706' },

  // Vitamins & Supplements
  { name: 'Vitamin D3', defaultDosage: '60000 IU', form: 'CAPSULE', defaultFood: 'AFTER_FOOD', category: 'Vitamin Supplement', color: '#0284c7' },
  { name: 'Shelcal 500', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Calcium & Vitamin D', color: '#0284c7' },
  { name: 'Neurobion Forte', defaultDosage: '1 tablet', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Vitamin B-Complex', color: '#0284c7' },
  { name: 'Zincovit', defaultDosage: '1 tablet', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Multivitamin', color: '#0284c7' },
  { name: 'Becosules', defaultDosage: '1 capsule', form: 'CAPSULE', defaultFood: 'AFTER_FOOD', category: 'B-Complex + Vit C', color: '#0284c7' },
  { name: 'Limcee', defaultDosage: '500mg', form: 'TABLET', defaultFood: 'AFTER_FOOD', category: 'Vitamin C Chewable', color: '#0284c7' },

  // Thyroid & Hormones
  { name: 'Thyronorm', defaultDosage: '50mcg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Thyroid Hormone', color: '#9333ea' },
  { name: 'Eltroxin', defaultDosage: '50mcg', form: 'TABLET', defaultFood: 'BEFORE_FOOD', category: 'Thyroid Hormone', color: '#9333ea' }
];

const COLOR_PALETTE = ['#0d9488', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#059669', '#0284c7', '#9333ea'];

/**
 * Normalizes text to check for drug matches even with minor OCR character errors.
 */
function cleanWord(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks similarity between candidate string and known drug name.
 */
function matchKnownDrug(rawCandidate) {
  const cand = cleanWord(rawCandidate);
  if (cand.length < 3) return null;

  for (const drug of KNOWN_DRUGS) {
    const drugNameClean = cleanWord(drug.name);
    // Exact or substring match
    if (cand.includes(drugNameClean) || drugNameClean.includes(cand)) {
      return drug;
    }

    // Levenshtein / character-level tolerance for OCR errors (e.g., 0 for o, 1 for l)
    const normalizedCand = cand.replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's');
    const normalizedDrug = drugNameClean.replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's');
    if (normalizedCand.includes(normalizedDrug) || normalizedDrug.includes(normalizedCand)) {
      return drug;
    }
  }
  return null;
}

/**
 * Maps standard medical frequency strings to MediSync schedule objects.
 */
function parseScheduleSlots(line) {
  const upper = line.toUpperCase();
  const slots = [];

  // 1-0-1 or 1 - 0 - 1 or 1/0/1 pattern
  const patternMatch = upper.match(/([012])\s*[-/:]\s*([012])\s*[-/:]\s*([012])/);
  if (patternMatch) {
    const morning = Number(patternMatch[1]);
    const afternoon = Number(patternMatch[2]);
    const night = Number(patternMatch[3]);

    if (morning > 0) slots.push({ time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: morning, recurrence_type: 'DAILY' });
    if (afternoon > 0) slots.push({ time_slot: 'AFTERNOON', scheduled_time: '13:30', dosage_quantity: afternoon, recurrence_type: 'DAILY' });
    if (night > 0) slots.push({ time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: night, recurrence_type: 'DAILY' });
    return slots;
  }

  // 1-0-0-1 pattern (4 times)
  const pattern4Match = upper.match(/([012])\s*[-/:]\s*([012])\s*[-/:]\s*([012])\s*[-/:]\s*([012])/);
  if (pattern4Match) {
    if (Number(pattern4Match[1]) > 0) slots.push({ time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' });
    if (Number(pattern4Match[2]) > 0) slots.push({ time_slot: 'AFTERNOON', scheduled_time: '13:30', dosage_quantity: 1, recurrence_type: 'DAILY' });
    if (Number(pattern4Match[3]) > 0) slots.push({ time_slot: 'EVENING', scheduled_time: '18:30', dosage_quantity: 1, recurrence_type: 'DAILY' });
    if (Number(pattern4Match[4]) > 0) slots.push({ time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' });
    return slots;
  }

  // Latin abbreviations & English keywords
  if (upper.includes('TDS') || upper.includes('TID') || upper.includes('THRICE') || upper.includes('3 TIMES')) {
    return [
      { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'AFTERNOON', scheduled_time: '13:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
    ];
  }

  if (upper.includes('BD') || upper.includes('BID') || upper.includes('TWICE') || upper.includes('2 TIMES')) {
    return [
      { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
    ];
  }

  if (upper.includes('QID') || upper.includes('4 TIMES')) {
    return [
      { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'AFTERNOON', scheduled_time: '13:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'EVENING', scheduled_time: '18:30', dosage_quantity: 1, recurrence_type: 'DAILY' },
      { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
    ];
  }

  if (upper.includes('HS') || upper.includes('BEDTIME') || upper.includes('AT NIGHT') || upper.includes('NIGHT ONLY')) {
    return [
      { time_slot: 'NIGHT', scheduled_time: '21:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
    ];
  }

  if (upper.includes('OD') || upper.includes('ONCE') || upper.includes('DAILY') || upper.includes('MORNING')) {
    return [
      { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
    ];
  }

  // Fallback default: Morning
  return [
    { time_slot: 'MORNING', scheduled_time: '08:30', dosage_quantity: 1, recurrence_type: 'DAILY' }
  ];
}

/**
 * Extracts food instruction from line or text context.
 */
function parseFoodInstruction(line, defaultVal = 'AFTER_FOOD') {
  const upper = line.toUpperCase();
  if (
    upper.includes('BEFORE FOOD') || 
    upper.includes('BEFORE MEAL') || 
    upper.includes('EMPTY STOMACH') || 
    upper.includes(' A/C') || 
    upper.includes(' AC') ||
    upper.includes('BBF')
  ) {
    return 'BEFORE_FOOD';
  }
  if (
    upper.includes('WITH FOOD') || 
    upper.includes('WITH MEAL') || 
    upper.includes('DURING MEAL')
  ) {
    return 'WITH_FOOD';
  }
  if (
    upper.includes('AFTER FOOD') || 
    upper.includes('AFTER MEAL') || 
    upper.includes('POST MEAL') || 
    upper.includes(' P/C') || 
    upper.includes(' PC') ||
    upper.includes('ABF')
  ) {
    return 'AFTER_FOOD';
  }
  return defaultVal;
}

/**
 * Extracts dosage strength (e.g., 500mg, 10mg, 5ml, 650 mg).
 */
function parseDosageStrength(line, fallback = '1 tablet') {
  const match = line.match(/\b(\d+(?:\.\d+)?)\s*(mg|mcg|gm|g|ml|iu|units?)\b/i);
  if (match) {
    return `${match[1]}${match[2].toLowerCase()}`;
  }
  return fallback;
}

/**
 * Extracts form (TABLET, CAPSULE, SYRUP, etc.).
 */
function parseForm(line, fallback = 'TABLET') {
  const upper = line.toUpperCase();
  if (upper.includes('CAP') || upper.includes('CAPSULE')) return 'CAPSULE';
  if (upper.includes('SYP') || upper.includes('SYRUP') || upper.includes('SUSP') || upper.includes('SUSPENSION')) return 'SYRUP';
  if (upper.includes('INJ') || upper.includes('INJECTION')) return 'INJECTION';
  if (upper.includes('DROP') || upper.includes('DROPS')) return 'DROPS';
  if (upper.includes('INHALER') || upper.includes('PUFF') || upper.includes('ROTA')) return 'INHALER';
  if (upper.includes('OINT') || upper.includes('GEL') || upper.includes('CREAM')) return 'OINTMENT';
  if (upper.includes('TAB') || upper.includes('TABLET')) return 'TABLET';
  return fallback;
}

/**
 * Estimates duration and end date from line.
 */
function parseDurationAndDates(line) {
  const today = new Date();
  const upper = line.toUpperCase();

  const daysMatch = line.match(/\b(?:FOR|X)?\s*(\d+)\s*(?:DAYS?|D)\b/i);
  const weeksMatch = line.match(/\b(?:FOR|X)?\s*(\d+)\s*(?:WEEKS?|W)\b/i);
  const monthsMatch = line.match(/\b(?:FOR|X)?\s*(\d+)\s*(?:MONTHS?|M)\b/i);

  let days = 0;
  if (daysMatch) days = parseInt(daysMatch[1], 10);
  else if (weeksMatch) days = parseInt(weeksMatch[1], 10) * 7;
  else if (monthsMatch) days = parseInt(monthsMatch[1], 10) * 30;

  if (days > 0) {
    const end = new Date(today);
    end.setDate(today.getDate() + days);
    return {
      isChronic: false,
      endDate: end.toISOString().split('T')[0],
      durationDays: days
    };
  }

  if (upper.includes('CONTINUE') || upper.includes('REGULAR') || upper.includes('CHRONIC') || upper.includes('DAILY')) {
    return { isChronic: true, endDate: null, durationDays: 30 };
  }

  // Default to non-chronic 10 days if antibiotic, else chronic 30 days
  return { isChronic: true, endDate: null, durationDays: 30 };
}

/**
 * Main parser: takes OCR text and returns an array of structured medicines.
 */
export function parsePrescriptionText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const detectedMedicines = [];
  const seenNames = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter out common doctor header / footer noise
    if (/^(Dr\.|Doctor|Clinic|Hospital|MBBS|MD|MS|Phone|Ph:|Tel:|Reg|Date|Age|Sex|Gender|Patient|Address|Rx|Diagnosis|Chief|Complaint|Investigation|Signature)/i.test(line)) {
      continue;
    }

    // Combine current line with next line if next line looks like a dosage/frequency subline
    let combinedLine = line;
    if (i + 1 < lines.length) {
      const next = lines[i + 1];
      if (/^([012]\s*[-/:]|[0-9]+\s*(days?|tab|cap|ml)|after\s+food|before\s+food|od|bd|tds|hs)/i.test(next)) {
        combinedLine = `${line} ${next}`;
      }
    }

    // 1. Check known drugs in our dictionary
    const knownMatch = matchKnownDrug(combinedLine);
    let medName = '';
    let defaultDetails = null;

    if (knownMatch) {
      medName = knownMatch.name;
      defaultDetails = knownMatch;
    } else {
      // 2. Heuristic extraction: look for numbered list or "Tab / Cap" prefixes
      // e.g. "1. Azithral 500mg", "Tab. Pantocid 40", "Cap. Becosules"
      const prefixMatch = combinedLine.match(/^(?:\d+[\.\)]\s*)?(?:Tab|Cap|Syp|Inj|T\.|C\.)?\s*([A-Za-z0-9\-]{3,20})/i);
      const dosePattern = combinedLine.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|gm|g|ml)\b/i);

      if (prefixMatch && (dosePattern || combinedLine.match(/[012]\s*[-/:]\s*[012]/))) {
        const candidate = prefixMatch[1].trim();
        // Ignore noise words
        if (!['take', 'give', 'apply', 'morning', 'night', 'daily', 'twice', 'thrice', 'tablet', 'capsule', 'syrup'].includes(candidate.toLowerCase())) {
          medName = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    if (medName && !seenNames.has(medName.toLowerCase())) {
      seenNames.add(medName.toLowerCase());

      const form = parseForm(combinedLine, defaultDetails?.form || 'TABLET');
      const dosage = parseDosageStrength(combinedLine, defaultDetails?.defaultDosage || '1 tablet');
      const foodInstruction = parseFoodInstruction(combinedLine, defaultDetails?.defaultFood || 'AFTER_FOOD');
      const schedules = parseScheduleSlots(combinedLine);
      const { isChronic, endDate, durationDays } = parseDurationAndDates(combinedLine);
      const colorTag = COLOR_PALETTE[detectedMedicines.length % COLOR_PALETTE.length];

      // Estimate initial stock
      const dosesPerDay = schedules.length;
      const initialStock = Math.max(10, dosesPerDay * (durationDays || 15));

      detectedMedicines.push({
        id: `ocr-${Date.now()}-${detectedMedicines.length}`,
        name: medName,
        dosage,
        form,
        food_instruction: foodInstruction,
        color_tag: colorTag,
        instructions: `Scanned from Prescription. ${isChronic ? 'Long term maintenance' : `Duration: ${durationDays} days`}`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate,
        is_chronic: isChronic,
        schedules,
        initial_stock: initialStock,
        unit: form === 'SYRUP' ? 'bottles' : (form === 'INHALER' ? 'inhalers' : (form === 'DROPS' ? 'bottles' : 'tablets')),
        low_stock_threshold: Math.max(3, Math.round(initialStock * 0.2)),
        category: defaultDetails?.category || 'Prescription Medicine',
        rawSnippet: combinedLine
      });
    }
  }

  return detectedMedicines;
}

/**
 * 3 High-Quality Realistic Sample Prescriptions for Instant Testing
 */
export const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'rx-fever-cold',
    title: 'General Physician: Fever, Cold & Acidity',
    doctor: 'Dr. Rajesh Sharma, MD (Medicine)',
    hospital: 'Apex Care Multi-Speciality Clinic',
    rawText: `APEX CARE MULTI-SPECIALITY CLINIC
Dr. Rajesh Sharma, MD (Internal Medicine)
Reg No: MCI-48921-A | Date: Today
Patient: Self (Adult)

Rx (Prescription):
1. Tab. Dolo 650mg - 1-0-1 (Twice Daily) after food x 5 days
2. Tab. Pantoprazole 40mg - 1-0-0 (Morning) before food x 10 days
3. Cap. Amoxicillin 500mg - 1-0-1 (Twice Daily) after food x 5 days
4. Tab. Levocetirizine 5mg - 0-0-1 (Night) at bedtime x 7 days

Advice: Hydrate well, rest, follow up if fever persists.`,
    description: '4 medicines (Dolo 650, Pantoprazole 40mg, Amoxicillin 500mg, Levocetirizine 5mg) with morning/night schedules.'
  },
  {
    id: 'rx-diabetes-bp',
    title: 'Cardio-Diabetic Care: Hypertension & Diabetes',
    doctor: 'Dr. Priya Deshmukh, DM (Cardiology)',
    hospital: 'Heart & Hormone Life Centre',
    rawText: `HEART & HORMONE LIFE CENTRE
Dr. Priya Deshmukh, MBBS, MD, DM (Cardiology)
Reg No: MMC-88219 | Date: Today
Patient: Chronic Care Follow-up

Rx (Maintenance Regimen):
1. Tab. Metformin 500mg - 1-0-1 (Twice Daily) with food [Continue]
2. Tab. Telmisartan 40mg - 1-0-0 (Morning) after breakfast [Daily]
3. Tab. Atorvastatin 10mg - 0-0-1 (Night) after dinner [Daily]
4. Cap. Vitamin D3 60000 IU - 1-0-0 (Once weekly) with milk

Advice: Low salt diet, 30 min morning walk, monitor fasting blood glucose.`,
    description: '4 chronic maintenance medicines (Metformin 500mg, Telmisartan 40mg, Atorvastatin 10mg, Vitamin D3 60000 IU).'
  },
  {
    id: 'rx-gastric-pain',
    title: 'Orthopedic & Gastro: Pain & Joint Care',
    doctor: 'Dr. Arvind Verma, MS (Ortho)',
    hospital: 'City Orthocare Hospital',
    rawText: `CITY ORTHOCARE HOSPITAL
Dr. Arvind Verma, MBBS, MS (Orthopedics)
Reg No: ORTHO-3420 | Date: Today
Patient: Knee Pain Consultation

Rx:
1. Tab. Aceclofenac 100mg - 1-0-1 (Twice Daily) after food x 7 days
2. Cap. Pan-D - 1-0-0 (Morning) empty stomach x 10 days
3. Tab. Shelcal 500 - 0-1-0 (Afternoon) after lunch x 30 days
4. Tab. Neurobion Forte - 1-0-0 (Morning) after food x 30 days

Advice: Avoid squatting, apply ice pack twice daily.`,
    description: '4 medicines (Aceclofenac, Pan-D, Shelcal 500, Neurobion Forte) with morning, afternoon, night slots.'
  }
];
