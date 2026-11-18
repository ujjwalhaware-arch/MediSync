import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Send, 
  CheckCircle, 
  ShieldAlert, 
  Bot, 
  Globe,
  Clock,
  Volume2
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceAssistantPage() {
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
        : 'Hello! I am your MediSync Voice Assistant. You can ask "What medicines do I take today?" or tell me "I have taken my medicine".'
    }
  ]);
  const [pendingConfirmationDose, setPendingConfirmationDose] = useState(null);
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
      if (transcript.trim()) {
        handleUserMessage(transcript.trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, [transcript]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const speakText = (text, langCode = language) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (langCode === 'hi') utterance.lang = 'hi-IN';
    else if (langCode === 'mr') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use text input below.');
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
        console.error('Error starting recognition:', err);
      }
    }
  };

  const handleUserMessage = async (msg) => {
    if (!msg.trim()) return;

    setConversation(prev => [...prev, { sender: 'user', text: msg }]);
    setTextInput('');
    setTranscript('');

    const lower = msg.toLowerCase();

    try {
      // Query today
      if (
        lower.includes('today') ||
        lower.includes('what medicines') ||
        lower.includes('आज') ||
        lower.includes('औषधे') ||
        (lower.includes('दवा') && (lower.includes('कौन') || lower.includes('क्या')))
      ) {
        const todayDoses = await api.getTodayDoses();
        if (todayDoses.length === 0) {
          addBotReply(language === 'hi' ? 'आज के लिए कोई निर्धारित दवा नहीं है।' : language === 'mr' ? 'आजसाठी कोणतेही औषध नियोजित नाही.' : 'You have no scheduled medicines for today.');
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
      // Taken intent
      else if (
        lower.includes('taken') ||
        lower.includes('took') ||
        lower.includes('खा ली') ||
        lower.includes('ले ली') ||
        lower.includes('घेतले')
      ) {
        const todayDoses = await api.getTodayDoses();
        const pending = todayDoses.filter(d => d.status === 'SCHEDULED');

        if (pending.length === 0) {
          addBotReply(language === 'hi' ? 'आज की सभी निर्धारित दवाएं पहले ही ली जा चुकी हैं!' : language === 'mr' ? 'आजची सर्व नियोजित औषधे आधीच घेतली आहेत!' : 'All your scheduled medicines for today are already marked as taken!');
          return;
        }

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
      // Next dose intent
      else if (
        lower.includes('next') ||
        lower.includes('अगली') ||
        lower.includes('पुढचे')
      ) {
        const todayDoses = await api.getTodayDoses();
        const pending = todayDoses.filter(d => d.status === 'SCHEDULED');

        if (pending.length === 0) {
          addBotReply(language === 'hi' ? 'आज के लिए अब कोई अगली दवा बाकी नहीं है।' : language === 'mr' ? 'आजसाठी आता कोणतेही पुढील औषध शिल्लक नाही.' : 'You have no more upcoming medicines for today.');
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
      // Inventory intent
      else if (lower.includes('stock') || lower.includes('left') || lower.includes('बची') || lower.includes('शिल्लक')) {
        const inv = await api.getInventory();
        const low = inv.filter(i => i.is_low_stock);

        if (low.length > 0) {
          const names = low.map(i => `${i.medicine_name} (${i.current_stock} ${i.unit})`).join(', ');
          addBotReply(`Low stock alert: ${names}. Refill is recommended.`);
        } else {
          addBotReply('You have plenty of stock remaining for all your active prescriptions.');
        }
      }
      else {
        addBotReply("I can help you with your daily prescriptions. Try asking 'What medicines do I take today?' or say 'I have taken my medicine'.");
      }
    } catch (err) {
      addBotReply('Could not access prescription records. Please try again.');
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
      const confirmationMsg = `Confirmed! Marked ${pendingConfirmationDose.medicine_name} as taken. Great job!`;
      setPendingConfirmationDose(null);
      addBotReply(confirmationMsg);
    } catch (e) {
      addBotReply('Failed to record dose.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Multilingual Voice Assistant
            </h2>
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Hands-free voice interaction for elderly and visually impaired patients
          </p>
        </div>

        {/* Language switcher */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'mr', label: 'मराठी' }
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                language === l.code ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Voice Assistant Console */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/40">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none shadow-sm'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs'
                }`}
              >
                <p>{msg.text}</p>
              </div>

              {msg.hasConfirmation && pendingConfirmationDose && (
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={confirmDoseTaken}
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Taken</span>
                  </button>
                  <button
                    onClick={() => setPendingConfirmationDose(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}

          {isListening && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs flex items-center space-x-2 animate-pulse">
              <Mic className="w-4 h-4 text-teal-600 animate-bounce" />
              <span>Listening in {language.toUpperCase()}... "{transcript || '...'}"</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Sample Prompts */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium shrink-0">Try asking:</span>
          {[
            t.voice.sample1,
            t.voice.sample2,
            t.voice.sample3
          ].map((sample, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleUserMessage(sample)}
              className="shrink-0 px-3 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200/60 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          <button
            onClick={toggleListening}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md transition-all ${
              isListening ? 'bg-rose-500 animate-voice-pulse shadow-rose-500/30' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-95'
            }`}
            title={isListening ? 'Stop' : 'Tap to speak'}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUserMessage(textInput);
            }}
            className="flex-1 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={isListening ? 'Listening...' : 'Or type a question...'}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isListening}
              className="flex-1 px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-3 rounded-xl bg-slate-900 text-white disabled:opacity-30 hover:bg-slate-800 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Safety Disclaimer */}
        <div className="px-4 py-2 bg-amber-50/70 border-t border-amber-200/50 flex items-center space-x-2 text-[10px] text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span className="truncate">{t.voice.safetyNote}</span>
        </div>
      </div>
    </div>
  );
}

