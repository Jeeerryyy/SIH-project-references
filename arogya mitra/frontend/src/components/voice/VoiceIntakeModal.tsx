import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Check,
  Globe,
  Sparkles,
  AlertCircle,
  FileText,
  Activity,
  Trash2,
} from 'lucide-react';

interface VoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIntake: (intakeData: {
    transcript: string;
    chiefComplaints: string;
    duration: string;
    urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    vitalsHint?: {
      temp?: number;
      bp?: string;
    };
  }) => void;
}

export const VoiceIntakeModal: React.FC<VoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  onApplyIntake,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [transcript, setTranscript] = useState('');
  const [parsedComplaints, setParsedComplaints] = useState('');
  const [parsedDuration, setParsedDuration] = useState('2 days');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const quickSymptoms = [
    { label: 'तेज़ बुखार (High Fever)', hi: 'मरीज को पिछले 3 दिनों से तेज़ बुखार और सिरदर्द है', en: 'Patient has high fever and severe headache for 3 days', urgency: 'URGENT' as const },
    { label: 'सांस लेने में तकलीफ (Breathlessness)', hi: 'सांस लेने में भारी तकलीफ और सीने में जकड़न है', en: 'Severe breathlessness and chest tightness', urgency: 'EMERGENCY' as const },
    { label: 'सीने में दर्द (Chest Pain)', hi: 'सीने में अचानक तेज दर्द और बायीं बांह में दर्द फैल रहा है', en: 'Sudden sharp chest pain radiating to left arm with sweating', urgency: 'EMERGENCY' as const },
    { label: 'गर्भावस्था दर्द (ANC Labor/Pain)', hi: 'गर्भवती महिला को तेज पेट दर्द और रक्तस्राव की शिकायत है', en: 'Pregnant woman experiencing severe abdominal cramps and bleeding', urgency: 'EMERGENCY' as const },
    { label: 'उल्टी दस्त (Vomiting/Diarrhea)', hi: 'लगातार उल्टी और पानी जैसे दस्त से कमजोरी है', en: 'Severe dehydration due to acute vomiting and watery diarrhea', urgency: 'URGENT' as const },
    { label: 'खांसी व जुकाम (Cough & Cold)', hi: 'हल्की खांसी और गले में खराश 4 दिन से है', en: 'Mild cough and sore throat for 4 days', urgency: 'ROUTINE' as const },
  ];

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Check Web Speech API availability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
        extractStructuredData(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMsg(`Voice input: ${event.error}. You can also pick quick symptoms below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMsg('Web Speech API not supported in this browser. Please use the quick symptom triggers or type directly.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen, language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setErrorMsg(null);
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
          setIsListening(true);
        } else {
          setErrorMsg('Speech recognition engine not initialized. Use quick symptom cards.');
        }
      } catch (err: any) {
        setErrorMsg('Microphone access denied or busy. Click quick symptom buttons.');
      }
    }
  };

  const extractStructuredData = (text: string) => {
    setParsedComplaints(text);

    const lower = text.toLowerCase();
    if (
      lower.includes('chest pain') ||
      lower.includes('सीने') ||
      lower.includes('सांस') ||
      lower.includes('breath') ||
      lower.includes('रक्तस्राव') ||
      lower.includes('bleeding') ||
      lower.includes('behoshi') ||
      lower.includes('unconscious')
    ) {
      setUrgency('EMERGENCY');
    } else if (
      lower.includes('fever') ||
      lower.includes('बुखार') ||
      lower.includes('उल्टी') ||
      lower.includes('vomit') ||
      lower.includes('pressure')
    ) {
      setUrgency('URGENT');
    } else {
      setUrgency('ROUTINE');
    }

    if (lower.includes('3 days') || lower.includes('3 दिन') || lower.includes('तीन दिन')) {
      setParsedDuration('3 days');
    } else if (lower.includes('1 week') || lower.includes('एक हफ्ता') || lower.includes('सात दिन')) {
      setParsedDuration('7 days');
    } else if (lower.includes('urgent') || lower.includes('अचानक') || lower.includes('today')) {
      setParsedDuration('Acute (< 24 hrs)');
    }
  };

  const handleSelectQuickSymptom = (symptom: typeof quickSymptoms[0]) => {
    const text = language === 'hi-IN' ? symptom.hi : symptom.en;
    setTranscript(text);
    extractStructuredData(text);
    setUrgency(symptom.urgency);
  };

  const handleApply = () => {
    onApplyIntake({
      transcript,
      chiefComplaints: parsedComplaints || transcript,
      duration: parsedDuration,
      urgency,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(13, 27, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '650px',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--primary-navy)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.0625rem' }}>
                ASHA Frontline Voice Intake Assistant
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                आशा दीदी हिंदी / English आवाज़ से लक्षण दर्ज करें
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setLanguage(language === 'hi-IN' ? 'en-IN' : 'hi-IN')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Globe size={14} />
              <span>{language === 'hi-IN' ? '🇮🇳 हिन्दी (Hindi)' : '🇬🇧 English'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pulsing Mic Recorder Card */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: isListening ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-surface-secondary)',
              border: isListening ? '2px solid #ef4444' : '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={toggleListening}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#ef4444' : 'var(--accent-blue)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.6)' : 'var(--shadow-md)',
                transition: 'all 0.25s ease',
              }}
              title={isListening ? 'Click to stop listening' : 'Click to start speech recognition'}
            >
              {isListening ? <MicOff size={36} /> : <Mic size={36} />}
            </button>

            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: isListening ? '#dc2626' : 'var(--text-primary)' }}>
                {isListening
                  ? language === 'hi-IN'
                    ? '🔴 आवाज़ सुन रहे हैं... बोलिए (Listening in Hindi...)'
                    : '🔴 Listening in English... Speak clearly'
                  : 'माइक्रोफ़ोन दबाएं और लक्षण बोलें (Tap Mic to Speak)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {isListening
                  ? 'Real-time speech-to-text converting spoken symptoms to clinical notes'
                  : 'Works on smartphone browsers & laptops without special hardware'}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid #f59e0b',
                color: '#92400e',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} color="#d97706" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Spoken Transcript Area */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Live Speech Transcript (बोले गए शब्द)
              </label>
              {transcript && (
                <button
                  onClick={() => {
                    setTranscript('');
                    setParsedComplaints('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                extractStructuredData(e.target.value);
              }}
              placeholder="बोलने पर लक्षण यहाँ दिखाई देंगे... अथवा सीधे टाइप करें (Spoken text will appear here...)"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Quick Frontline Clinical Chips */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ⚡ 1-Tap Field Symptoms (तुरंत लक्षण चुनें)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {quickSymptoms.map((qs, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectQuickSymptom(qs)}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{qs.label}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {language === 'hi-IN' ? qs.hi.slice(0, 32) + '...' : qs.en.slice(0, 32) + '...'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Structured Clinical Preview */}
          <div
            style={{
              backgroundColor: 'rgba(2, 132, 199, 0.05)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--accent-blue)' }}>
                ✨ Parsed Clinical Summary
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor:
                    urgency === 'EMERGENCY' ? '#ef4444' : urgency === 'URGENT' ? '#f59e0b' : '#10b981',
                  color: '#ffffff',
                }}
              >
                {urgency} TRIAGE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Chief Complaint
                </label>
                <input
                  type="text"
                  value={parsedComplaints}
                  onChange={(e) => setParsedComplaints(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Duration
                </label>
                <input
                  type="text"
                  value={parsedDuration}
                  onChange={(e) => setParsedDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!transcript && !parsedComplaints}
            style={{
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: !transcript && !parsedComplaints ? 'not-allowed' : 'pointer',
              opacity: !transcript && !parsedComplaints ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Check size={16} />
            <span>Apply to Patient Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
