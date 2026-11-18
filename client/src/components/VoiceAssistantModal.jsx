import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceAssistantModal({ isOpen, onClose, onDoseUpdated }) {
  const { language, setLanguage, t } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState([
    {
      sender: 'bot',
      text: language === 'hi' 
        ? 'नमस्ते! मैं आपका मेडीसिंक आवाज सहायक हूँ। आज की दवाएं जानने के लिए पूछें, या कहें "मैंने दवा ले ली है"।'
        : language === 'mr'
        ? 'नमस्कार! मी तुमचा मेडीसिंक व्हॉइस असिस्टंट आहे. आजची औषधे विचारण्यासाठी किंवा "मी औषध घेतले आहे" सांगण्यासाठी बोला.'
        : 'Hello! I am your MediSync Voice Assistant. Ask "What medicines do I take today?" or tell me "I have taken my medicine".'
    }
  ]);
  const [pendingConfirmationDose, setPendingConfirmationDose] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      setIsListening(false);
      // If we have a transcript, process it
      if (transcript.trim()) {
        handleUserMessage(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [transcript]);

  // Scroll to bottom of conversation
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!isOpen) return null;

  // Speak text using SpeechSynthesis
  const speakText = (text, langCode = language) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop prior speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (langCode === 'hi') utterance.lang = 'hi-IN';
    else if (langCode === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95; // Gentle pace for senior patients
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use the text input below.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      const recLang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
      recognitionRef.current.lang = recLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Main natural language query interpreter
  const handleUserMessage = async (msg) => {
    if (!msg.trim()) return;

    // Append user message
    const userMsg = { sender: 'user', text: msg };
    setConversation(prev => [...prev, userMsg]);
    setTextInput('');
    setTranscript('');

    const lower = msg.toLowerCase();

    try {
      // 1. INTENT: Query Today's Medicines
      if (
        lower.includes('today') ||
        lower.includes('what medicines') ||
        lower.includes('आज') ||
        lower.includes('औषधे') ||
        lower.includes('दवा') && (lower.includes('कौन') || lower.includes('क्या'))
      ) {
        const todayDoses = await api.getTodayDoses();

        if (todayDoses.length === 0) {
          const resp = language === 'hi' 
            ? 'आज के लिए कोई निर्धारित दवा नहीं है।'
            : language === 'mr'
            ? 'आजसाठी कोणतेही औषध नियोजित नाही.'
            : 'You have no scheduled medicines for today.';
          addBotReply(resp);
          return;
        }

        const pending = todayDoses.filter(d => d.status === 'SCHEDULED');
        const taken = todayDoses.filter(d => d.status === 'TAKEN');

        let reply = '';
        if (language === 'hi') {
          reply = `आज आपकी कुल ${todayDoses.length} खुराकें हैं। आपने ${taken.length} ले ली हैं। बची हुई: `;
          reply += pending.map(d => `${d.medicine_name} (${d.scheduled_time})`).join(', ') || 'कोई नहीं!';
        } else if (language === 'mr') {
          reply = `आज तुमचे एकूण ${todayDoses.length} डोस आहेत. तुम्ही ${taken.length} घेतले आहेत. शिल्लक: `;
          reply += pending.map(d => `${d.medicine_name} (${d.scheduled_time})`).join(', ') || 'काही नाही!';
        } else {
          reply = `You have ${todayDoses.length} scheduled doses today. You have taken ${taken.length}. Pending: `;
          reply += pending.map(d => `${d.medicine_name} at ${d.scheduled_time}`).join(', ') || 'None!';
        }

        addBotReply(reply);
      }

      // 2. INTENT: Mark Dose as Taken
      else if (
        lower.includes('taken') ||
        lower.includes('took') ||
        lower.includes('खा ली') ||
        lower.includes('ले ली') ||
        lower.includes('घेतले') ||
        lower.includes('घेतली')
      ) {
        const todayDoses = await api.getTodayDoses();
        const pending = todayDoses.filter(d => d.status === 'SCHEDULED');

        if (pending.length === 0) {
          const resp = language === 'hi'
            ? 'आज की सभी निर्धारित दवाएं पहले ही ली जा चुकी हैं!'
            : language === 'mr'
            ? 'आजची सर्व नियोजित औषधे आधीच घेतली आहेत!'
            : 'All your scheduled medicines for today are already marked as taken!';
          addBotReply(resp);
          return;
        }

        // Target the earliest pending dose
        const candidate = pending[0];
        setPendingConfirmationDose(candidate);

        let confirmQuestion = '';
        if (language === 'hi') {
          confirmQuestion = `क्या आप ${candidate.medicine_name} (${candidate.scheduled_time}) को 'ले ली है' के रूप में दर्ज करना चाहते हैं? पुष्टि के लिए नीचे बटन दबाएं।`;
        } else if (language === 'mr') {
          confirmQuestion = `तुम्ही ${candidate.medicine_name} (${candidate.scheduled_time}) 'घेतले' म्हणून नोंदवू इच्छिता? पुष्टीसाठी खालील बटण दाबा.`;
        } else {
          confirmQuestion = `Would you like to confirm that you have taken ${candidate.medicine_name} scheduled for ${candidate.scheduled_time}? Click confirm below.`;
        }

        addBotReply(confirmQuestion, true);
      }

      // 3. INTENT: Query Next Medicine
      else if (
        lower.includes('next') ||
        lower.includes('अगली') ||
        lower.includes('पुढचे')
      ) {
        const todayDoses = await api.getTodayDoses();
        const pending = todayDoses.filter(d => d.status === 'SCHEDULED');

        if (pending.length === 0) {
          const resp = language === 'hi'
            ? 'आज के लिए अब कोई अगली दवा बाकी नहीं है।'
            : language === 'mr'
            ? 'आजसाठी आता कोणतेही पुढील औषध शिल्लक नाही.'
            : 'You have no more upcoming medicines for today.';
          addBotReply(resp);
          return;
        }

        const nextDose = pending[0];
        let reply = '';
        if (language === 'hi') {
          reply = `आपकी अगली दवा ${nextDose.medicine_name} (${nextDose.dosage}) है, जो ${nextDose.scheduled_time} पर निर्धारित है (${nextDose.food_instruction.replace('_', ' ').toLowerCase()})।`;
        } else if (language === 'mr') {
          reply = `तुमचे पुढचे औषध ${nextDose.medicine_name} (${nextDose.dosage}) आहे, जे ${nextDose.scheduled_time} वाजता घ्यायचे आहे.`;
        } else {
          reply = `Your next medicine is ${nextDose.medicine_name} (${nextDose.dosage}) at ${nextDose.scheduled_time} (${nextDose.food_instruction.replace('_', ' ').toLowerCase()}).`;
        }
        addBotReply(reply);
      }

      // 4. INTENT: Inventory check
      else if (
        lower.includes('stock') ||
        lower.includes('left') ||
        lower.includes('बची') ||
        lower.includes('शिल्लक')
      ) {
        const inv = await api.getInventory();
        const low = inv.filter(i => i.is_low_stock);

        let reply = '';
        if (low.length > 0) {
          const names = low.map(i => `${i.medicine_name} (${i.current_stock} ${i.unit})`).join(', ');
          reply = language === 'hi'
            ? `ध्यान दें! इन दवाओं का स्टॉक कम है: ${names}। कृपया जल्द नया स्टॉक खरीदें।`
            : language === 'mr'
            ? `लक्ष द्या! या औषधांचा साठा कमी आहे: ${names}। कृपया लवकर खरेदी करा.`
            : `Warning! Low stock detected for: ${names}. Refill is recommended.`;
        } else {
          reply = language === 'hi'
            ? 'आपके पास सभी दवाओं का पर्याप्त स्टॉक उपलब्ध है।'
            : language === 'mr'
            ? 'तुमच्याकडे सर्व औषधांचा पुरेसा साठा उपलब्ध आहे.'
            : 'You have sufficient stock for all your medications.';
        }
        addBotReply(reply);
      }

      // Fallback
      else {
        const fallback = language === 'hi'
          ? 'माफ़ कीजिए, मैं केवल आपकी दवाओं और अनुसूची से संबंधित प्रश्नों का उत्तर दे सकता हूँ। आप पूछ सकते हैं: "आज की दवाएं" या "मेरी अगली दवा कौन सी है?"'
          : language === 'mr'
          ? 'क्षमस्व, मी फक्त तुमच्या औषधांच्या वेळापत्रकाबद्दल माहिती देऊ शकतो. तुम्ही विचारू शकता: "आजची औषधे" किंवा "पुढचे औषध कोणते?"'
          : "I am designed to help with your prescribed schedule. Try asking: 'What medicines do I take today?' or 'What is my next dose?'";
        addBotReply(fallback);
      }
    } catch (err) {
      console.error('Voice Assistant processing error:', err);
      addBotReply('Could not connect to medication records. Please try again.');
    }
  };

  const addBotReply = (text, hasConfirmation = false) => {
    setConversation(prev => [...prev, { sender: 'bot', text, hasConfirmation }]);
    speakText(text);
  };

  const confirmDoseTaken = async () => {
    if (!pendingConfirmationDose) return;
    try {
      await api.updateDoseStatus(pendingConfirmationDose.id, 'TAKEN');
      const confirmationMsg = language === 'hi'
        ? `बधाई! ${pendingConfirmationDose.medicine_name} को सफलतापूर्वक 'ले ली है' के रूप में दर्ज कर दिया गया है।`
        : language === 'mr'
        ? `अभिनंदन! ${pendingConfirmationDose.medicine_name} 'घेतले' म्हणून यशस्वीरित्या नोंदवले गेले आहे.`
        : `Confirmed! Marked ${pendingConfirmationDose.medicine_name} as taken. Great job!`;
      
      setPendingConfirmationDose(null);
      addBotReply(confirmationMsg);
      if (onDoseUpdated) onDoseUpdated();
    } catch (e) {
      addBotReply('Failed to record dose. Please try marking manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[580px] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-1.5">
                <span>{t.voice.title}</span>
                <Sparkles className="w-4 h-4 text-teal-200" />
              </h2>
              <p className="text-xs text-teal-100 font-medium">{t.voice.supportedLanguages}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language toggle inside voice assistant */}
            <div className="flex bg-black/20 rounded-xl p-0.5 text-xs">
              {['en', 'hi', 'mr'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-0.5 rounded-lg font-bold uppercase transition-colors ${language === l ? 'bg-white text-teal-800' : 'text-teal-100 hover:text-white'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
              </div>

              {/* Confirmation CTA button */}
              {msg.hasConfirmation && pendingConfirmationDose && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={confirmDoseTaken}
                    className="flex items-center space-x-1 px-4 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Taken</span>
                  </button>
                  <button
                    onClick={() => setPendingConfirmationDose(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Listening Indicator */}
          {isListening && (
            <div className="flex items-center space-x-2 p-3 bg-teal-50 border border-teal-200/60 rounded-2xl text-teal-800 text-xs animate-pulse">
              <Mic className="w-4 h-4 text-teal-600 animate-bounce" />
              <span>{t.voice.listening}: "{transcript || '...'}"</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Sample Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 font-medium">Try:</span>
          {[
            t.voice.sample1,
            t.voice.sample2,
            t.voice.sample3
          ].map((sample, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleUserMessage(sample)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition-colors border border-slate-200/60"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Voice Microphone & Text Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          {/* Big Mic Button */}
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md transition-all ${
              isListening
                ? 'bg-rose-500 animate-voice-pulse shadow-rose-500/30'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-95'
            }`}
            title={isListening ? t.voice.stopListening : t.voice.tapToSpeak}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserMessage(textInput);
            }}
            className="flex-1 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isListening ? 'Listening...' : 'Or type your question here...'}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isListening}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-slate-900 text-white disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Medical Safety Disclaimer Footer */}
        <div className="px-4 py-2 bg-amber-50/70 border-t border-amber-200/50 flex items-center space-x-2 text-[10px] text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span className="truncate">{t.voice.safetyNote}</span>
        </div>
      </div>
    </div>
  );
}

