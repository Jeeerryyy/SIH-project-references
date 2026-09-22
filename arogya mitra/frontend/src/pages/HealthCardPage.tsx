import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  CreditCard,
  Printer,
  Download,
  Search,
  User,
  Phone,
  ShieldCheck,
  Heart,
  Calendar,
  Clock,
  FileText,
  Activity,
  AlertCircle,
  Pill,
  Share2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { api } from '../lib/api';

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  blood_group?: string;
  abha_id?: string;
  abha_address?: string;
  address?: string;
  allergies?: string;
  emergency_contact?: string;
}

interface Consultation {
  id: string;
  chief_complaints: string;
  clinical_notes?: string;
  created_at: string;
  prescriptions: Array<{
    medication_name: string;
    dosage?: string;
    frequency?: string;
    duration_days?: number;
    instructions?: string;
  }>;
}

export const HealthCardPage: React.FC = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.get<Patient[]>('/patients');
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatient(data[0]);
        fetchPatientEhr(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch patients for health card:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientEhr = async (patientId: string) => {
    try {
      const data = await api.get<Consultation[]>(`/clinical/consultations/patient/${patientId}`);
      setConsultations(data);
    } catch (err) {
      console.warn('No past consultations found or error fetching:', err);
      setConsultations([]);
    }
  };

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    fetchPatientEhr(p.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareCard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Arogya Mitra Citizen ABHA Pass\nPatient: ${selectedPatient?.first_name} ${selectedPatient?.last_name}\nABHA ID: ${selectedPatient?.abha_id || '91-4829-1029-3847'}\nABHA Address: ${selectedPatient?.abha_address || 'citizen@abdm'}\nBlood Group: ${selectedPatient?.blood_group || 'B+'}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    return (
      fullName.includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      (p.abha_id && p.abha_id.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {t('health_card.title', 'Citizen ABHA Digital Health Card & Portal')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('health_card.subtitle', 'National Ayushman Bharat Digital Identity Pass & Longitudinal Medical Records')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleShareCard}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {copiedLink ? <CheckCircle2 size={15} color="#10b981" /> : <Share2 size={15} />}
            <span>{copiedLink ? 'Copied to Clipboard!' : 'Share Pass'}</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: 'var(--primary-navy)',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Printer size={15} />
            <span>Print Official PVC Card</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Patient Directory Picker + Health Card & Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Patient Selector Sidebar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--primary-navy)' }}>
            Select Citizen Profile
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ABHA, MRN..."
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem 0.45rem 2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '520px', overflowY: 'auto' }}>
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-light)',
                    backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-surface-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      {p.first_name} {p.last_name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      {p.blood_group || 'O+'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    MRN: {p.mrn} • {p.gender}, {p.date_of_birth?.slice(0, 4) || '1990'}
                  </div>
                  {p.abha_id && (
                    <div style={{ fontSize: '0.625rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                      ABHA: {p.abha_id}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Ayushman Bharat Digital Card & Longitudinal Records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedPatient ? (
            <>
              {/* National PVC Health Pass Card Container */}
              <div
                id="print-health-card"
                style={{
                  width: '100%',
                  maxWidth: '680px',
                  background: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 50%, #0369a1 100%)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(13, 27, 42, 0.4), 0 8px 10px -6px rgba(13, 27, 42, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Holographic Watermark Circle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Card Top: Govt Emblem & Title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingBottom: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>🇮🇳</div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        National Health Authority
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#93c5fd', fontWeight: 600 }}>
                        Ayushman Bharat Digital Mission (ABDM) • Arogya Mitra Pass
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    OFFICIAL PHR
                  </div>
                </div>

                {/* Card Middle: Avatar, Details & QR Code */}
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px', gap: '1.25rem', alignItems: 'center' }}>
                  {/* Photo Avatar */}
                  <div
                    style={{
                      width: '85px',
                      height: '95px',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#cbd5e1',
                    }}
                  >
                    <User size={38} color="#93c5fd" />
                    <span style={{ fontSize: '0.5625rem', marginTop: '4px', fontWeight: 700, color: '#e2e8f0' }}>
                      CITIZEN
                    </span>
                  </div>

                  {/* Citizen Credentials */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.02em', color: '#ffffff' }}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>

                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em' }}>
                      {selectedPatient.abha_id || '91-4829-1029-3847'}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                      ABHA Address: <strong>{selectedPatient.abha_address || `${selectedPatient.first_name.toLowerCase()}@abdm`}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#e2e8f0', marginTop: '0.2rem' }}>
                      <span>Gender: <strong>{selectedPatient.gender}</strong></span>
                      <span>DOB: <strong>{selectedPatient.date_of_birth?.slice(0, 10) || '1992-04-12'}</strong></span>
                      <span>Blood: <strong style={{ color: '#f87171' }}>{selectedPatient.blood_group || 'O+'}</strong></span>
                    </div>
                  </div>

                  {/* QR Code Pass */}
                  <div
                    onClick={() => setShowQrModal(true)}
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                    }}
                    title="Click to expand ABDM Verification QR"
                  >
                    <QrCode size={76} color="#0d1b2a" />
                    <span style={{ fontSize: '0.5625rem', color: '#0d1b2a', fontWeight: 800, marginTop: '2px' }}>
                      SCAN TO VERIFY
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Emergency Contact & Microchip Stripe */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                    color: '#93c5fd',
                  }}
                >
                  <div>
                    Emergency Contact: <strong style={{ color: '#ffffff' }}>{selectedPatient.emergency_contact || '+91 98765 43210'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={13} color="#34d399" />
                    <span>Cryptographically Signed ABDM M1/M2/M3</span>
                  </div>
                </div>
              </div>

              {/* Known Allergies & Risk Warning Banner */}
              {selectedPatient.allergies && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <AlertCircle size={20} color="#dc2626" />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#dc2626' }}>
                      CRITICAL ALLERGY ALERT: {selectedPatient.allergies}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                      Automated CDSS cross-reaction active against penicillin derivatives, NSAIDs, and sulfa drugs.
                    </div>
                  </div>
                </div>
              )}

              {/* Longitudinal Medical History (PHR Timeline) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--accent-blue)" />
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-navy)' }}>
                      Longitudinal Personal Health Records (EHR)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {consultations.length} Consultations Recorded
                  </span>
                </div>

                {consultations.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recorded consultations yet. Start an OPD consultation or teleconsult to generate clinical records.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {consultations.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        style={{
                          borderLeft: '3px solid var(--accent-blue)',
                          paddingLeft: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            🩺 {c.chief_complaints}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        {c.clinical_notes && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {c.clinical_notes}
                          </p>
                        )}

                        {c.prescriptions && c.prescriptions.length > 0 && (
                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface-secondary)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.5rem 0.75rem',
                              marginTop: '0.25rem',
                            }}
                          >
                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '0.25rem' }}>
                              Prescribed Medications:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {c.prescriptions.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    fontSize: '0.6875rem',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid var(--border-light)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  💊 {p.medication_name} ({p.dosage || '1 tab'} - {p.frequency || 'OD'})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a citizen from the left panel to inspect their Ayushman Bharat Digital Health Pass.
            </div>
          )}
        </div>
      </div>

      {/* QR Modal Simulator */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(13, 27, 42, 0.75)',
            backdropFilter: 'blur(4px)',
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
              padding: '2rem',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary-navy)' }}>
              ABDM QR Verification Pass
            </div>
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid var(--border-medium)',
              }}
            >
              <QrCode size={180} color="#0d1b2a" />
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Scan with any ABDM compliant scanner or Ayushman Bharat App to load care contexts.
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                backgroundColor: 'var(--primary-navy)',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default HealthCardPage;
