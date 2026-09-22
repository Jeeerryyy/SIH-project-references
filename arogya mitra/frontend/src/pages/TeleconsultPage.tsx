import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Activity,
  Heart,
  Thermometer,
  Droplet,
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Stethoscope,
  Wifi,
  Sparkles,
  ChevronRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { CdssAlertsBadge } from '../components/cdss/CdssAlertsBadge';
import { VoiceIntakeModal } from '../components/voice/VoiceIntakeModal';

interface MedicationItem {
  medicine_name: string;
  generic_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const TeleconsultPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Video Call Controls State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'HD' | '2G_OPTIMIZED'>('HD');

  // Create Session Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [pulseRate, setPulseRate] = useState('78');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState('98.4');
  const [bloodSugar, setBloodSugar] = useState('110');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-Call Prescription State
  const [diagnosis, setDiagnosis] = useState('');
  const [snomedCode, setSnomedCode] = useState('');
  const [icd10Code, setIcd10Code] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [lifestyleAdvice, setLifestyleAdvice] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 tablet');
  const [newMedFreq, setNewMedFreq] = useState('1-0-1 (Twice Daily)');
  const [newMedDuration, setNewMedDuration] = useState('5 Days');
  const [newMedInstructions, setNewMedInstructions] = useState('After meals');
  const [isCompletingCall, setIsCompletingCall] = useState(false);
  const [completedSuccessMsg, setCompletedSuccessMsg] = useState('');

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/teleconsult/sessions');
      setSessions(res || []);
    } catch (err) {
      console.error('Failed to fetch teleconsult sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients?size=50');
      const items = res.items || [];
      setPatients(items);
      if (items.length > 0 && !selectedPatientId) {
        setSelectedPatientId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchPatients();
  }, []);

  // Timer for active call
  useEffect(() => {
    let interval: any = null;
    if (activeSession) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/teleconsult/sessions', {
        patient_id: selectedPatientId,
        specialty,
        chief_complaint: chiefComplaint,
        vitals_snapshot: {
          pulse_rate: parseInt(pulseRate) || 75,
          blood_pressure_sys: parseInt(systolic) || 120,
          blood_pressure_dia: parseInt(diastolic) || 80,
          spo2: parseInt(spo2) || 98,
          temperature: parseFloat(temperature) || 98.6,
          blood_sugar_fbs: parseInt(bloodSugar) || 100,
        },
      });
      setIsCreateModalOpen(false);
      setChiefComplaint('');
      await fetchSessions();
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Failed to request teleconsultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCall = async (session: any) => {
    try {
      const joinRes = await api.post(`/teleconsult/sessions/${session.id}/join`, {});
      setActiveSession({
        ...session,
        room_token: joinRes.room_token,
      });

      // Pre-fill initial vitals or diagnosis if present
      if (session.chief_complaint) {
        setClinicalNotes(`Patient presented with: ${session.chief_complaint}`);
      }
      // Preload a default common medicine template
      setMedications([
        {
          medicine_name: 'Tab. Paracetamol 500mg',
          generic_name: 'Paracetamol',
          dosage: '1 tab',
          frequency: '1-0-1 (Twice daily)',
          duration: '3 days',
          instructions: 'After meals for fever/pain relief',
        },
      ]);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Could not connect to video consultation room.');
    }
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications([
      ...medications,
      {
        medicine_name: newMedName,
        generic_name: newMedGeneric || newMedName,
        dosage: newMedDosage,
        frequency: newMedFreq,
        duration: newMedDuration,
        instructions: newMedInstructions,
      },
    ]);
    setNewMedName('');
    setNewMedGeneric('');
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis before signing the prescription.');
      return;
    }
    setIsCompletingCall(true);
    try {
      // 1. Submit consultation & digital prescription
      await api.post('/clinical/consultations', {
        patient_id: activeSession.patient_id,
        visit_type: 'TELECONSULT',
        chief_complaint: activeSession.chief_complaint || 'Teleconsultation Review',
        clinical_notes: clinicalNotes,
        diagnosis,
        snomed_codes: snomedCode ? [snomedCode] : ['38341003'],
        icd10_codes: icd10Code ? [icd10Code] : ['R50.9'],
        vitals: activeSession.vitals_snapshot || {},
        prescription: {
          patient_id: activeSession.patient_id,
          medications,
          diet_lifestyle_advice: lifestyleAdvice,
        },
      });

      // 2. Complete teleconsult session
      await api.post(`/teleconsult/sessions/${activeSession.id}/complete`, {
        diagnosis,
        clinical_summary: clinicalNotes,
        prescription_notes: `${medications.length} items prescribed. ${lifestyleAdvice}`,
      });

      setCompletedSuccessMsg(`Consultation successfully signed and recorded in patient's ABHA EHR!`);
      setTimeout(() => {
        setCompletedSuccessMsg('');
        setActiveSession(null);
        fetchSessions();
      }, 2500);
    } catch (err) {
      console.error('Failed to complete consultation:', err);
      alert('Failed to submit consultation record.');
    } finally {
      setIsCompletingCall(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="w-7 h-7 text-primary" />
            {t('teleconsult.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('teleconsult.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchSessions} className="gap-1 text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Request Teleconsult
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {completedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">{completedSuccessMsg}</p>
            <p className="text-xs text-emerald-700">Digital prescription signed and transmitted to sub-centre pharmacy.</p>
          </div>
        </div>
      )}

      {/* Active Video Call Screen */}
      {activeSession ? (
        <div className="space-y-6 animate-fade-in">
          {/* In-Call Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-primary/95 text-white px-6 py-3.5 rounded-2xl shadow-md gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{t('teleconsult.in_call_badge')}</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                    {formatTimer(callDuration)}
                  </span>
                </div>
                <p className="text-xs text-blue-100">
                  Patient: <strong className="text-white">{activeSession.patient_name || 'Rajesh Patil'}</strong> (MRN: {activeSession.patient_mrn || 'MH-2026-0041'}) • Doctor: <strong>{user?.full_name || user?.username}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setNetworkQuality((prev) => (prev === 'HD' ? '2G_OPTIMIZED' : 'HD'))
                }
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                title="Adaptive Bitrate Mode for Rural Bandwidth"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                {networkQuality === 'HD' ? 'Low Latency HD' : '2G Edge Compressed'}
              </button>

              <Button
                variant="outline"
                onClick={() => setActiveSession(null)}
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent gap-1.5 text-xs py-1.5 px-3 font-semibold shadow"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                Leave Room
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Video Feeds & Controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* WebRTC Split Screen Container */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-xl aspect-[16/10] border border-slate-800 flex flex-col justify-between p-4">
                {/* Main Video Stream: Remote Sub-Centre / Patient */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
                  {isVideoOff ? (
                    <div className="text-center text-slate-400 space-y-2">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <User className="w-10 h-10" />
                      </div>
                      <p className="text-sm font-medium">Ayushman Arogya Mandir Sub-Centre</p>
                      <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-400">
                        Camera Turned Off (Bandwidth Saving)
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Simulated Doctor/Patient Video Placeholder Canvas */}
                      <div className="text-center space-y-3">
                        <div className="relative mx-auto w-24 h-24 rounded-full bg-blue-900/60 border-2 border-blue-400 flex items-center justify-center shadow-inner">
                          <Stethoscope className="w-12 h-12 text-blue-300" />
                          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-lg">
                            {activeSession.patient_name || 'Patient & CHO Video Stream'}
                          </p>
                          <p className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            WebRTC Low-Latency Secure Mesh Connected
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Badge on Video */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ABDM End-to-End Encrypted
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                    24 FPS • 128 kbps
                  </span>
                </div>

                {/* PiP Inset Video: Local Doctor Feed */}
                <div className="relative z-10 self-end w-36 sm:w-44 aspect-[4/3] bg-slate-900/90 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl flex items-center justify-center p-2">
                  <div className="text-center">
                    <div className="w-9 h-9 bg-primary/40 rounded-full flex items-center justify-center mx-auto text-primary-foreground text-xs font-bold">
                      {(user?.full_name || user?.username || 'DR').slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-medium text-slate-200 mt-1 truncate max-w-[120px]">
                      {user?.full_name || user?.username} (You)
                    </p>
                    <span className="text-[9px] text-emerald-400">DH Specialist</span>
                  </div>
                </div>

                {/* Bottom Overlay Controls Bar */}
                <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-3 rounded-full backdrop-blur-md transition shadow-md ${
                      isMicMuted
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-3 rounded-full backdrop-blur-md transition shadow-md ${
                      isVideoOff
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setActiveSession(null)}
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-md"
                    title="End Video Stream"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Real-Time Vitals HUD */}
              <Card orientation="vertical" className="p-4 bg-slate-50 border-border">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground">
                      {t('teleconsult.vitals_hud')}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">Snapshot from IoT Device</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Pulse */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="flex items-center justify-center text-rose-500 mb-1">
                      <Heart className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="text-xl font-bold text-slate-800 font-mono">
                      {activeSession.vitals_snapshot?.pulse_rate || pulseRate}{' '}
                      <span className="text-xs font-normal text-slate-500">bpm</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Pulse Rate</div>
                  </div>

                  {/* BP */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="flex items-center justify-center text-blue-500 mb-1">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-bold text-slate-800 font-mono">
                      {activeSession.vitals_snapshot?.blood_pressure_sys || systolic}/
                      {activeSession.vitals_snapshot?.blood_pressure_dia || diastolic}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Blood Pressure</div>
                  </div>

                  {/* SpO2 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="flex items-center justify-center text-teal-500 mb-1">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-slate-800 font-mono">
                      {activeSession.vitals_snapshot?.spo2 || spo2}
                      <span className="text-xs font-normal text-slate-500">%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Oxygen SpO2</div>
                  </div>

                  {/* Temp */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="flex items-center justify-center text-amber-500 mb-1">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-slate-800 font-mono">
                      {activeSession.vitals_snapshot?.temperature || temperature}°
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Temperature</div>
                  </div>

                  {/* Blood Sugar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-center text-purple-500 mb-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xl font-bold text-slate-800 font-mono">
                      {activeSession.vitals_snapshot?.blood_sugar_fbs || bloodSugar}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">FBS Sugar</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right 5 Cols: In-Call Doctor Prescription & Notes Pad */}
            <div className="lg:col-span-5 space-y-4">
              {/* AI CDSS Clinical Intelligence & Safety Badge */}
              <CdssAlertsBadge
                patientId={activeSession?.patient_id}
                vitals={{
                  bp_systolic: Number(activeSession?.vitals_snapshot?.bp_systolic || systolic || 120),
                  bp_diastolic: Number(activeSession?.vitals_snapshot?.bp_diastolic || diastolic || 80),
                  pulse: Number(activeSession?.vitals_snapshot?.pulse || pulseRate || 78),
                  spo2: Number(activeSession?.vitals_snapshot?.spo2 || spo2 || 98),
                  temp_f: Number(activeSession?.vitals_snapshot?.temperature || temperature || 98.4),
                }}
                symptoms={[activeSession?.chief_complaint || diagnosis || 'General Teleconsultation']}
                proposedMedications={medications.map((m) => ({
                  name: m.medicine_name,
                  generic_name: m.generic_name,
                  dosage: m.dosage,
                }))}
                currentDiagnoses={diagnosis ? [diagnosis] : []}
                compact={false}
              />

              <Card orientation="vertical" className="p-5 border-border shadow-sm bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base text-foreground">
                      {t('teleconsult.prescription_pad')}
                    </h3>
                  </div>
                  <Badge variant="info" className="text-[10px] text-primary border-primary">
                    Digital EHR Signing
                  </Badge>
                </div>

                {/* Diagnosis & Coding */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Diagnosis *
                    </label>
                    <Input
                      placeholder="e.g., Essential Hypertension, Acute Bronchitis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        SNOMED-CT Code
                      </label>
                      <Input
                        placeholder="e.g., 38341003"
                        value={snomedCode}
                        onChange={(e) => setSnomedCode(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        ICD-10 Code
                      </label>
                      <Input
                        placeholder="e.g., I10 / E11.9"
                        value={icd10Code}
                        onChange={(e) => setIcd10Code(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor Clinical Notes & Observations
                    </label>
                    <textarea
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Patient reports 3-day history of fatigue and headache..."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Prescribed Drugs List */}
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Generic Medicines ({medications.length})
                    </label>
                    <span className="text-[11px] text-muted-foreground">Jan Aushadhi Formulary</span>
                  </div>

                  {medications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No medications added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {medications.map((med, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{med.medicine_name}</p>
                            <p className="text-[11px] text-slate-500">
                              {med.dosage} • {med.frequency} • {med.duration} ({med.instructions})
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Medication Mini Form */}
                  <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine Name (e.g. Tab Amlodipine 5mg)"
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Generic Molecule Name"
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                        value={newMedGeneric}
                        onChange={(e) => setNewMedGeneric(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Dosage (1 tab)"
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Freq (1-0-1)"
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                        value={newMedFreq}
                        onChange={(e) => setNewMedFreq(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duration (5 days)"
                        className="p-1.5 bg-white border border-slate-300 rounded text-xs"
                        value={newMedDuration}
                        onChange={(e) => setNewMedDuration(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleAddMedication}
                      className="w-full text-xs py-1 h-7 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      + Add Medication Item
                    </Button>
                  </div>
                </div>

                {/* Diet & Lifestyle Advice */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dietary & Lifestyle Advice
                  </label>
                  <Input
                    placeholder="Low salt diet, 30 min brisk walk, drink 3L water"
                    value={lifestyleAdvice}
                    onChange={(e) => setLifestyleAdvice(e.target.value)}
                  />
                </div>

                {/* Action Submit */}
                <Button
                  variant="primary"
                  onClick={handleCompleteConsultation}
                  disabled={isCompletingCall}
                  className="w-full py-2.5 font-bold gap-2 text-sm shadow-md bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompletingCall
                    ? 'Signing & Encrypting...'
                    : t('teleconsult.finish_call')}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Teleconsultation Waiting Sessions Queue */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t('teleconsult.waiting_queue')} ({sessions.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Ayushman Arogya Mandir (AAM) to District Hospital Live Connect
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading teleconsultation queue...
            </div>
          ) : sessions.length === 0 ? (
            <Card orientation="vertical" className="p-8 text-center bg-slate-50 border-dashed border-2">
              <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700">No Pending Teleconsultation Requests</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Sub-Centre Community Health Officers (CHOs) can initiate real-time video consults with District Hospital specialists when high-risk symptoms are detected.
              </p>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 gap-2 text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Initiate Demo Call Request
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  orientation="vertical"
                  className="p-5 hover:shadow-md transition-shadow border-border space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={
                          session.status === 'WAITING'
                            ? 'warning'
                            : session.status === 'IN_CALL'
                            ? 'danger'
                            : 'success'
                        }
                      >
                        {session.status}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(session.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      {session.patient_name || 'Patient'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      MRN: {session.patient_mrn || 'N/A'} • {session.specialty}
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">Complaint: </span>
                      <span className="text-slate-600">
                        {session.chief_complaint || 'General routine consultation review.'}
                      </span>
                    </div>

                    {session.vitals_snapshot && (
                      <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1 text-rose-600 font-semibold">
                          <Heart className="w-3.5 h-3.5" />
                          {session.vitals_snapshot.pulse_rate || 78} bpm
                        </span>
                        <span>•</span>
                        <span>
                          BP: {session.vitals_snapshot.blood_pressure_sys || 120}/
                          {session.vitals_snapshot.blood_pressure_dia || 80}
                        </span>
                        <span>•</span>
                        <span>SpO2: {session.vitals_snapshot.spo2 || 98}%</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Sub-Centre: {session.sub_centre_branch_name || 'Arogya Mandir'}
                    </span>

                    {session.status !== 'COMPLETED' ? (
                      <Button
                        variant="primary"
                        onClick={() => handleJoinCall(session)}
                        className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {t('teleconsult.start_call_btn')}
                      </Button>
                    ) : (
                      <Badge variant="success" className="text-xs text-emerald-600 border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHO Request Teleconsultation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Request Specialist Teleconsult
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (MRN: {p.mrn} • {p.age_years}y, {p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialist Department *</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Obstetrics & Gynecology (Maternal)">Obstetrics & Gynecology (Maternal)</option>
                  <option value="Pediatrics & Neonatal">Pediatrics & Neonatal</option>
                  <option value="Cardiology (NCD)">Cardiology (NCD)</option>
                  <option value="Endocrinology (Diabetes)">Endocrinology (Diabetes)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Chief Complaint & Symptoms *</label>
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition"
                  >
                    <Mic className="w-3 h-3 text-primary animate-pulse" />
                    <span>ASHA Voice Intake (हिंदी/EN)</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Patient presenting with recurrent dizziness and elevated BP readings..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Vitals Snapshot Inputs */}
              <div className="border-t border-border pt-3 space-y-2">
                <label className="block font-bold text-slate-800">
                  Sub-Centre Point-of-Care Vitals
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-600">Pulse (bpm)</span>
                    <input
                      type="number"
                      value={pulseRate}
                      onChange={(e) => setPulseRate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600">BP Sys (mmHg)</span>
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600">BP Dia (mmHg)</span>
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600">SpO2 (%)</span>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600">Temp (°F)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600">Sugar FBS</span>
                    <input
                      type="number"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="text-xs font-semibold"
                >
                  {isSubmitting ? 'Requesting...' : 'Submit Call Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Intake Modal for Frontline ASHA Workers */}
      <VoiceIntakeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyIntake={(intake) => {
          setChiefComplaint(intake.chiefComplaints);
        }}
      />
    </div>
  );
};
