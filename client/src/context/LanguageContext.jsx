import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    appName: "MediSync",
    tagline: "Intelligent Medicine Reminder & Treatment Adherence Tracker",
    nav: {
      dashboard: "Dashboard",
      medicines: "My Medicines",
      reminders: "Dose Reminders",
      inventory: "Medicine Inventory",
      voice: "Voice Assistant",
      analytics: "Analytics & Reports",
      caregiver: "Caregiver Portal",
      caregiverSettings: "Caregiver Access",
      settings: "Settings",
      logout: "Log Out"
    },
    greetings: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      welcomeBack: "Welcome back",
      subtitle: "Here is your medication plan and adherence summary for today."
    },
    status: {
      taken: "Taken",
      skipped: "Skipped",
      missed: "Missed",
      scheduled: "Scheduled",
      due: "Due Now",
      upcoming: "Upcoming"
    },
    actions: {
      markTaken: "Mark Taken",
      markSkipped: "Skip Dose",
      refill: "Refill Stock",
      addMedicine: "Add Medicine",
      viewAll: "View All",
      exportPdf: "Export Weekly PDF",
      listenVoice: "Voice Assistant",
      linkPatient: "Link Patient",
      generateCode: "Generate Pairing Code",
      confirm: "Confirm",
      cancel: "Cancel"
    },
    slots: {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Night"
    },
    voice: {
      title: "Multilingual Voice Assistant",
      listening: "Listening... Speak your command",
      tapToSpeak: "Tap to Speak",
      stopListening: "Stop Listening",
      supportedLanguages: "Supports English, Hindi, and Marathi",
      sample1: "What medicines do I need to take today?",
      sample2: "I have taken my medicine",
      sample3: "What is my next medicine?",
      safetyNote: "Medical Notice: Voice Assistant only queries your verified prescription schedule. It does not provide medical diagnosis or alter dosages."
    },
    stats: {
      todayAdherence: "Today's Adherence",
      weeklyScore: "7-Day Adherence Rate",
      dosesTaken: "Doses Taken",
      dosesRemaining: "Remaining Today",
      missedAlerts: "Missed Dose Incidents",
      lowStockAlerts: "Low Stock Items"
    }
  },
  hi: {
    appName: "मेडीसिंक",
    tagline: "बुद्धिमान दवा अनुस्मारक और उपचार अनुपालन ट्रैकर",
    nav: {
      dashboard: "डैशबोर्ड",
      medicines: "मेरी दवाएं",
      reminders: "दवा अनुस्मारक",
      inventory: "दवा स्टॉक (इन्वेंट्री)",
      voice: "आवाज सहायक (वॉयस)",
      analytics: "विश्लेषण और रिपोर्ट",
      caregiver: "देखभालकर्ता पोर्टल",
      caregiverSettings: "देखभालकर्ता सेटिंग्स",
      settings: "सेटिंग्स",
      logout: "लॉग आउट"
    },
    greetings: {
      morning: "शुभ प्रभात",
      afternoon: "शुभ दोपहर",
      evening: "शुभ संध्या",
      welcomeBack: "वापसी पर स्वागत है",
      subtitle: "यहाँ आज की आपकी दवा का समय और अनुपालन रिपोर्ट है।"
    },
    status: {
      taken: "ले ली",
      skipped: "छोड़ी गई",
      missed: "छूट गई",
      scheduled: "निर्धारित",
      due: "अभी समय है",
      upcoming: "आगामी"
    },
    actions: {
      markTaken: "ले ली है",
      markSkipped: "छोड़ें",
      refill: "स्टॉक भरें",
      addMedicine: "दवा जोड़ें",
      viewAll: "सभी देखें",
      exportPdf: "साप्ताहिक रिपोर्ट (PDF)",
      listenVoice: "आवाज से पूछें",
      linkPatient: "मरीज को जोड़ें",
      generateCode: "पेयरिंग कोड बनाएं",
      confirm: "पुष्टि करें",
      cancel: "रद्द करें"
    },
    slots: {
      morning: "सुबह",
      afternoon: "दोपहर",
      evening: "शाम",
      night: "रात"
    },
    voice: {
      title: "बहुभाषी आवाज सहायक",
      listening: "सुन रहे हैं... कृपया बोलें",
      tapToSpeak: "बोलने के लिए दबाएं",
      stopListening: "रोकें",
      supportedLanguages: "अंग्रेजी, हिंदी और मराठी समर्थित",
      sample1: "आज मुझे कौन सी दवाएं लेनी हैं?",
      sample2: "मैंने अपनी दवा ले ली है",
      sample3: "मेरी अगली दवा कौन सी है?",
      safetyNote: "चिकित्सा सूचना: वॉयस असिस्टेंट केवल आपके सहेजे गए पर्चे की जांच करता है। यह स्वतंत्र रूप से कोई दवा या खुराक नहीं बदलता।"
    },
    stats: {
      todayAdherence: "आज का अनुपालन",
      weeklyScore: "7-दिवसीय अनुपालन दर",
      dosesTaken: "ली गई दवाएं",
      dosesRemaining: "आज बची हुई",
      missedAlerts: "छूटी हुई खुराक",
      lowStockAlerts: "कम स्टॉक वाली दवाएं"
    }
  },
  mr: {
    appName: "मेडीसिंक",
    tagline: "बुद्धिमान औषध स्मरण आणि उपचार ट्रॅकर",
    nav: {
      dashboard: "डॅशबोर्ड",
      medicines: "माझी औषधे",
      reminders: "औषधांची आठवण",
      inventory: "औषध साठा (स्टॉक)",
      voice: "व्हॉइस असिस्टंट",
      analytics: "अहवाल आणि विश्लेषण",
      caregiver: "काळजीवाहू पोर्टल",
      caregiverSettings: "काळजीवाहू जोडणी",
      settings: "सेटिंग्ज",
      logout: "बाहेर पडा"
    },
    greetings: {
      morning: "शुभ सकाळ",
      afternoon: "शुभ दुपार",
      evening: "शुभ संध्याकाळ",
      welcomeBack: "पुन्हा स्वागत आहे",
      subtitle: "येथे तुमचे आजचे औषध वेळापत्रक आणि अनुपालन सारांश आहे."
    },
    status: {
      taken: "घेतले",
      skipped: "वगळले",
      missed: "चुकले",
      scheduled: "नियोजित",
      due: "वेळ झाली आहे",
      upcoming: "पुढील"
    },
    actions: {
      markTaken: "घेतले म्हणून नोंदवा",
      markSkipped: "वगळा",
      refill: "साठा भरा",
      addMedicine: "नवीन औषध जोडा",
      viewAll: "सर्व पहा",
      exportPdf: "साप्ताहिक अहवाल (PDF)",
      listenVoice: "आवाजाने विचारा",
      linkPatient: "रुग्ण जोडा",
      generateCode: "पेअरिंग कोड तयार करा",
      confirm: "निश्चित करा",
      cancel: "रद्द करा"
    },
    slots: {
      morning: "सकाळ",
      afternoon: "दुपार",
      evening: "संध्याकाळ",
      night: "रात्र"
    },
    voice: {
      title: "बहुभाषिक व्हॉइस असिस्टंट",
      listening: "ऐकत आहे... कृपया बोला",
      tapToSpeak: "बोलण्यासाठी दाबा",
      stopListening: "थांबवा",
      supportedLanguages: "इंग्रजी, हिंदी आणि मराठी समर्थित",
      sample1: "मला आज कोणती औषधे घ्यायची आहेत?",
      sample2: "मी माझे औषध घेतले आहे",
      sample3: "माझे पुढचे औषध कोणते आहे?",
      safetyNote: "वैद्यकीय सूचना: व्हॉइस असिस्टंट केवळ तुमच्या सेव्ह केलेल्या प्रिस्क्रिप्शनची माहिती देतो. तो कोणताही वैद्यकीय सल्ला किंवा डोस बदलत नाही."
    },
    stats: {
      todayAdherence: "आजचे अनुपालन",
      weeklyScore: "७ दिवसांचे अनुपालन",
      dosesTaken: "घेतलेले डोस",
      dosesRemaining: "आज शिल्लक डोस",
      missedAlerts: "चुकलेले डोस",
      lowStockAlerts: "कमी साठा असलेली औषधे"
    }
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('smartmedi_lang') || 'en';
  });

  const changeLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguage(lang);
      localStorage.setItem('smartmedi_lang', lang);
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

