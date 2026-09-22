import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Siren,
  AlertTriangle,
  HeartPulse,
  Activity,
  Radio,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  X,
  RefreshCw,
  PhoneCall,
  MapPin,
  ShieldAlert,
  Flame,
  Stethoscope,
  Send,
} from 'lucide-react';

export const EmergencyDispatchPage: React.FC = () => {
  const { t } = useTranslation();

  const [fleet, setFleet] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const [traumaBayStatus, setTraumaBayStatus] = useState<any | null>(null);

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  // Dispatch Form State
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [urgency, setUrgency] = useState('EMERGENCY_CRITICAL');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Live Paramedic Vitals State (Stream simulator)
  const [streamPulse, setStreamPulse] = useState(128);
  const [streamSysBP, setStreamSysBP] = useState(90);
  const [streamDiaBP, setStreamDiaBP] = useState(60);
  const [streamSpO2, setStreamSpO2] = useState(89.0);
  const [streamGCS, setStreamGCS] = useState(10);
  const [streamO2Flow, setStreamO2Flow] = useState(10.0);
  const [streamECG, setStreamECG] = useState('SINUS_TACHYCARDIA');
  const [paramedicNotes, setParamedicNotes] = useState('');
  const [isStreamingVitals, setIsStreamingVitals] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fleetRes, dispatchesRes, patientsRes] = await Promise.all([
        api.get('/emergency/fleet'),
        api.get('/emergency/dispatches'),
        api.get('/patients?size=50'),
      ]);
      setFleet(fleetRes || []);
      const dList = dispatchesRes || [];
      setDispatches(dList);
      if (dList.length > 0 && !activeDispatchId) {
        setActiveDispatchId(dList[0].id);
        fetchTraumaBay(dList[0].id);
      }
      const pList = patientsRes?.items || [];
      setPatients(pList);
      if (pList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pList[0].id);
      }
      if (fleetRes && fleetRes.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(fleetRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load emergency data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTraumaBay = async (dispatchId: string) => {
    try {
      const tb = await api.get(`/emergency/dispatches/${dispatchId}/trauma-bay`);
      setTraumaBayStatus(tb);
    } catch (err) {
      console.error('Failed to load trauma bay status:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      // Auto-refresh telemetry every 10s
      if (activeDispatchId) {
        fetchTraumaBay(activeDispatchId);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [activeDispatchId]);

  const handleSelectDispatch = (d: any) => {
    setActiveDispatchId(d.id);
    fetchTraumaBay(d.id);
  };

  const handleCreateDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName || !callerPhone || !locationName || !chiefComplaint) {
      alert('Please fill all required emergency caller and triage details.');
      return;
    }

    try {
      setIsSubmittingDispatch(true);
      const res = await api.post('/emergency/dispatch', {
        caller_name: callerName,
        caller_phone: callerPhone,
        location_name: locationName,
        pickup_lat: 26.9124,
        pickup_lng: 75.7873,
        patient_id: selectedPatientId || undefined,
        vehicle_id: selectedVehicleId || undefined,
        chief_complaint: chiefComplaint,
        urgency: urgency,
      });

      setIsDispatchModalOpen(false);
      setActionSuccessMsg(`108 Emergency Ambulance Dispatched! ETA: ${res.estimated_arrival_minutes || 8} mins`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchData();
      setActiveDispatchId(res.id);
      fetchTraumaBay(res.id);
    } catch (err) {
      console.error('Failed to dispatch 108 emergency:', err);
      alert('Dispatch failed. Please check network connectivity.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleStreamVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchId) return;

    try {
      setIsStreamingVitals(true);
      await api.post(`/emergency/dispatches/${activeDispatchId}/vitals`, {
        pulse_bpm: streamPulse,
        bp_systolic: streamSysBP,
        bp_diastolic: streamDiaBP,
        spo2_pct: streamSpO2,
        ecg_rhythm: streamECG,
        gcs_score: streamGCS,
        oxygen_flow_lpm: streamO2Flow,
        paramedic_notes: paramedicNotes || 'En-route telemetry packet transmitted to District Trauma Bay 1.',
      });

      setIsVitalsModalOpen(false);
      setActionSuccessMsg('Paramedic vitals stream transmitted! Trauma Bay alerted.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchData();
      if (activeDispatchId) fetchTraumaBay(activeDispatchId);
    } catch (err) {
      console.error('Failed to stream vitals:', err);
      alert('Failed to transmit en-route vitals.');
    } finally {
      setIsStreamingVitals(false);
    }
  };

  const activeDispatch = dispatches.find((d) => d.id === activeDispatchId) || dispatches[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-red)',
              }}
            >
              <Siren size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {t('emergency.title', '108 Emergency Command Hub & Pre-Hospital Trauma Bay')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            {t(
              'emergency.subtitle',
              'Real-Time ALS/BLS Ambulance Fleet Tracking, En-Route Paramedic Telemetry & District Hospital Trauma Bay Readiness'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={fetchData} leftIcon={<RefreshCw size={16} />}>
            {t('common.refresh', 'Refresh Fleet')}
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDispatchModalOpen(true)}
            leftIcon={<Siren size={16} />}
            style={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 800 }}
          >
            🚨 Dispatch 108 Ambulance
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={18} color="#ef4444" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top 4 HUD Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-red)',
            }}
          >
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Emergency Calls
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-red)' }}>
              {dispatches.length}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              108 Ambulances Ready (ALS/BLS)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
              {fleet.filter((f) => f.is_available).length} / {fleet.length}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <Stethoscope size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Trauma Bay 1 Hub Status
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              ACTIVE & ON-CALL
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Average Response Time
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>
              8.4 mins
            </div>
          </div>
        </Card>
      </div>

      {/* Main Split: Left Dispatches & Map / Right En-Route Telemetry HUD & Trauma Bay */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(420px, 1.3fr)', gap: '1.5rem' }}>
        {/* Left Column: Active Dispatches List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={18} color="var(--accent-red)" className="spin-slow" />
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>Live Emergency Incidents</h3>
              </div>
              <Badge variant="danger">{dispatches.length} ACTIVE</Badge>
            </div>

            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
                <div>Loading Dispatches...</div>
              </div>
            ) : dispatches.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div>No Active Emergency Calls</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dispatches.map((d) => {
                  const isSelected = d.id === activeDispatchId;
                  const isCritical = d.urgency === 'EMERGENCY_CRITICAL';

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDispatch(d)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: isSelected ? '2px solid var(--accent-red)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary-navy)' }}>
                          {d.dispatch_number}
                        </span>
                        <Badge variant={isCritical ? 'danger' : 'warning'}>
                          {d.urgency}
                        </Badge>
                      </div>

                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {d.chief_complaint}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        <MapPin size={13} color="var(--accent-red)" />
                        <span>{d.location_name}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--border-light)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Caller: <strong>{d.caller_name}</strong> ({d.caller_phone})
                        </span>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                          🚑 {d.assigned_vehicle?.registration_number || '108-ALS-01'} (ETA {d.estimated_arrival_minutes}m)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 108 Fleet Status Grid */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>108 Fleet Readiness Radar</h3>
              <Badge variant="info">{fleet.length} Vehicles</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {fleet.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--primary-navy)' }}>{v.registration_number}</strong>{' '}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({v.vehicle_type})</span>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Pilot: {v.driver_name} • {v.driver_phone}
                    </div>
                  </div>
                  <Badge variant={v.is_available ? 'success' : 'danger'}>
                    {v.is_available ? 'AVAILABLE' : 'DISPATCHED'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Paramedic Telemetry Stream & District Hospital Trauma Bay Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeDispatch ? (
            <>
              {/* Paramedic En-Route Telemetry HUD */}
              <Card style={{ padding: '1.5rem', backgroundColor: '#0f172a', color: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HeartPulse size={22} color="#f43f5e" className="pulse-animation" />
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 900, color: '#ffffff' }}>
                        En-Route Paramedic Telemetry HUD
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Ambulance: {activeDispatch.assigned_vehicle?.registration_number} • Call #{activeDispatch.dispatch_number}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsVitalsModalOpen(true)}
                    leftIcon={<Send size={14} />}
                    style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                  >
                    Simulate Vitals Packet
                  </Button>
                </div>

                {/* Vitals HUD 4-Box Grid */}
                {(() => {
                  const latest = activeDispatch.latest_vitals || {
                    pulse_bpm: 132,
                    bp_systolic: 85,
                    bp_diastolic: 50,
                    spo2_pct: 88.0,
                    gcs_score: 9,
                    ecg_rhythm: 'SINUS_TACHYCARDIA_WITH_PVC',
                    oxygen_flow_lpm: 12.0,
                    paramedic_notes: 'High-flow O2 NRB mask applied. Cervical spine immobilized. Rapid transit to Trauma Bay.',
                  };

                  const isHypoxic = (latest.spo2_pct || 98) < 90;
                  const isHypotensive = (latest.bp_systolic || 120) < 90;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {/* SpO2 */}
                        <div
                          style={{
                            backgroundColor: isHypoxic ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                            border: isHypoxic ? '1px solid #ef4444' : '1px solid #334155',
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SpO2 (%)</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isHypoxic ? '#f87171' : '#38bdf8' }}>
                            {latest.spo2_pct}%
                          </div>
                          {isHypoxic && (
                            <div style={{ fontSize: '0.6875rem', color: '#fca5a5', fontWeight: 800 }}>
                              HYPOXIC ALERT
                            </div>
                          )}
                        </div>

                        {/* Pulse / Heart Rate */}
                        <div
                          style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid #334155',
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Pulse (BPM)</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f43f5e' }}>
                            {latest.pulse_bpm}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#fda4af' }}>TACHYCARDIA</div>
                        </div>

                        {/* Blood Pressure */}
                        <div
                          style={{
                            backgroundColor: isHypotensive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                            border: isHypotensive ? '1px solid #ef4444' : '1px solid #334155',
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>BP (mmHg)</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isHypotensive ? '#f87171' : '#4ade80' }}>
                            {latest.bp_systolic}/{latest.bp_diastolic}
                          </div>
                          {isHypotensive && (
                            <div style={{ fontSize: '0.6875rem', color: '#fca5a5', fontWeight: 800 }}>
                              HYPOTENSION
                            </div>
                          )}
                        </div>

                        {/* GCS Coma Scale */}
                        <div
                          style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid #334155',
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>GCS Score</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24' }}>
                            {latest.gcs_score} / 15
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#fde68a' }}>MODERATE TRAUMA</div>
                        </div>
                      </div>

                      {/* ECG Rhythm & O2 Flow */}
                      <div
                        style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.5)',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #334155',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div>
                          <span style={{ color: '#94a3b8' }}>Live ECG Rhythm: </span>
                          <strong style={{ color: '#38bdf8' }}>{latest.ecg_rhythm}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8' }}>O2 Flow Rate: </span>
                          <strong style={{ color: '#4ade80' }}>{latest.oxygen_flow_lpm} LPM (NRB)</strong>
                        </div>
                      </div>

                      {/* Paramedic En-Route Radio Notes */}
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          padding: '0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #334155',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>
                          Paramedic Radio Transmission:
                        </div>
                        <p style={{ margin: 0, color: '#e2e8f0', fontStyle: 'italic' }}>
                          "{latest.paramedic_notes || 'Patient stable en-route.'}"
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </Card>

              {/* District Hospital Trauma Bay 1 Readiness Center */}
              <Card style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                      Trauma Bay 1 Hospital Pre-Arrival Protocol
                    </h3>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      District Hospital Jaipur • Automated Code Red Activation
                    </div>
                  </div>
                  <Badge variant="danger">CODE RED ACTIVE</Badge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid #10b981',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        Trauma Resuscitation Bay 1 Reserved & Cleared
                      </span>
                    </div>
                    <Badge variant="success">READY</Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid #10b981',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        Trauma Team Assembled (General Surgeon, Anesthetist, Orthopedic)
                      </span>
                    </div>
                    <Badge variant="success">IN BAY</Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid var(--accent-blue)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        Blood Bank: 2 Units O-Negative Uncrossmatched Packed RBCs Primed
                      </span>
                    </div>
                    <Badge variant="info">PRIMED</Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid var(--accent-blue)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="var(--accent-blue)" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        Emergency CT Trauma-Scan Fast Track Slot Cleared
                      </span>
                    </div>
                    <Badge variant="info">CLEARED</Badge>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Siren size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <div>No Active Emergency Selected</div>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL 1: Quick Dispatch 108 Ambulance */}
      {isDispatchModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Siren size={22} color="var(--accent-red)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Dispatch 108 Emergency Ambulance (ALS/BLS)
                </h2>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Caller Name
                  </label>
                  <Input
                    placeholder="e.g. Ramesh Kumar (Bystander)"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Caller Phone (108 Link)
                  </label>
                  <Input
                    placeholder="e.g. +91-9876543210"
                    value={callerPhone}
                    onChange={(e) => setCallerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Incident Pickup Location / Landmark
                </label>
                <Input
                  placeholder="e.g. NH-21 Highway Junction, Mile 44, Jaipur Rural..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Chief Complaint & Trauma Symptoms
                </label>
                <Input
                  placeholder="e.g. High-speed collision, severe chest trauma, altered sensorium..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="EMERGENCY_CRITICAL">🚨 EMERGENCY CRITICAL (Red Code)</option>
                    <option value="URGENT">URGENT (Yellow Code)</option>
                    <option value="NON_EMERGENCY">NON-EMERGENCY (Green Code)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Assign 108 Ambulance
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {fleet.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.vehicle_type}) - {v.driver_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Link Citizen ABHA / Patient (Optional)
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- Anonymous / Unknown Citizen --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.mrn}) • {p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setIsDispatchModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  type="submit"
                  disabled={isSubmittingDispatch}
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 800 }}
                >
                  {isSubmittingDispatch ? 'Dispatching Fleet...' : '🚨 Confirm 108 Dispatch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Simulate Paramedic Telemetry */}
      {isVitalsModalOpen && activeDispatch && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Transmit Live Paramedic Vitals Stream
                </h2>
              </div>
              <button
                onClick={() => setIsVitalsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStreamVitalsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Pulse / Heart Rate (BPM)
                  </label>
                  <Input
                    type="number"
                    value={streamPulse}
                    onChange={(e) => setStreamPulse(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Oxygen Saturation SpO2 (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={streamSpO2}
                    onChange={(e) => setStreamSpO2(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Blood Pressure Systolic (mmHg)
                  </label>
                  <Input
                    type="number"
                    value={streamSysBP}
                    onChange={(e) => setStreamSysBP(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Blood Pressure Diastolic (mmHg)
                  </label>
                  <Input
                    type="number"
                    value={streamDiaBP}
                    onChange={(e) => setStreamDiaBP(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Glasgow Coma Scale (GCS /15)
                  </label>
                  <Input
                    type="number"
                    value={streamGCS}
                    onChange={(e) => setStreamGCS(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Oxygen Flow Rate (LPM)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    value={streamO2Flow}
                    onChange={(e) => setStreamO2Flow(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  ECG Rhythm Interpretation
                </label>
                <select
                  value={streamECG}
                  onChange={(e) => setStreamECG(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="NORMAL_SINUS_RHYTHM">Normal Sinus Rhythm</option>
                  <option value="SINUS_TACHYCARDIA">Sinus Tachycardia (&gt;100 bpm)</option>
                  <option value="SINUS_TACHYCARDIA_WITH_PVC">Sinus Tachycardia with PVC</option>
                  <option value="VENTRICULAR_FIBRILLATION">🚨 Ventricular Fibrillation (V-Fib)</option>
                  <option value="ATRIAL_FIBRILLATION">Atrial Fibrillation (A-Fib)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Paramedic En-Route Observations
                </label>
                <Input
                  placeholder="e.g. Non-rebreather mask applied, IV line established, ETA 6 minutes..."
                  value={paramedicNotes}
                  onChange={(e) => setParamedicNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setIsVitalsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isStreamingVitals}>
                  {isStreamingVitals ? 'Transmitting...' : 'Transmit Telemetry to Trauma Bay'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
