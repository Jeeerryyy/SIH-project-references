import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Stethoscope,
  Pill,
  Baby,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';

export interface CdssAlert {
  category: 'ALLERGY' | 'INTERACTION' | 'CONTRAINDICATION' | 'VITALS_ABNORMAL' | 'TRIAGE_RED_FLAG';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

export interface CdssInteraction {
  drugs: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  effect: string;
  recommendation: string;
}

export interface CdssDiffDiagnosis {
  condition: string;
  icd10: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

export interface CdssEvaluateResponse {
  patient_id?: string;
  alerts: CdssAlert[];
  drug_interactions: CdssInteraction[];
  differential_diagnoses: CdssDiffDiagnosis[];
  lifestyle_advice: string[];
  triage_level: 'EMERGENCY_108' | 'URGENT_REFERRAL' | 'ROUTINE_OPD';
}

interface CdssAlertsBadgeProps {
  patientId?: string;
  vitals?: {
    bp_systolic?: number;
    bp_diastolic?: number;
    pulse?: number;
    spo2?: number;
    temp_f?: number;
    respiratory_rate?: number;
  };
  symptoms?: string[];
  proposedMedications?: Array<{
    name: string;
    generic_name?: string;
    dosage?: string;
    route?: string;
  }>;
  isPregnant?: boolean;
  knownAllergies?: string[];
  currentDiagnoses?: string[];
  onTriggerSos?: () => void;
  compact?: boolean;
}

export const CdssAlertsBadge: React.FC<CdssAlertsBadgeProps> = ({
  patientId,
  vitals,
  symptoms = [],
  proposedMedications = [],
  isPregnant = false,
  knownAllergies = [],
  currentDiagnoses = [],
  onTriggerSos,
  compact = false,
}) => {
  const [evaluation, setEvaluation] = useState<CdssEvaluateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        patient_id: patientId,
        vitals: vitals || {},
        symptoms: symptoms.length ? symptoms : ['General checkup'],
        proposed_medications: proposedMedications,
        is_pregnant: isPregnant,
        allergies: knownAllergies,
        current_diagnoses: currentDiagnoses,
      };
      const data = await api.post<CdssEvaluateResponse>('/cdss/evaluate', payload);
      setEvaluation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate CDSS rules');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: '#ef4444' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.1)', text: '#ea580c', border: '#f97316' };
      case 'MODERATE':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: '#f59e0b' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: '#3b82f6' };
    }
  };

  const hasCritical =
    evaluation?.alerts.some((a) => a.severity === 'CRITICAL') ||
    evaluation?.drug_interactions.some((i) => i.severity === 'CRITICAL') ||
    evaluation?.triage_level === 'EMERGENCY_108';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: hasCritical
          ? '2px solid #ef4444'
          : '1px solid var(--border-light)',
        boxShadow: hasCritical
          ? '0 0 15px rgba(239, 68, 68, 0.2)'
          : 'var(--shadow-sm)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* CDSS Header Bar */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          backgroundColor: hasCritical
            ? 'rgba(239, 68, 68, 0.08)'
            : 'var(--bg-surface-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: hasCritical ? '#ef4444' : 'var(--primary-navy)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                AI Clinical Decision Support (CDSS)
              </span>
              {evaluation && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor:
                      evaluation.triage_level === 'EMERGENCY_108'
                        ? '#ef4444'
                        : evaluation.triage_level === 'URGENT_REFERRAL'
                        ? '#f59e0b'
                        : '#10b981',
                    color: '#ffffff',
                  }}
                >
                  {evaluation.triage_level.replace('_', ' ')}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time DDI, Pregnancy safety, Cross-allergies & Vitals triage
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={runEvaluation}
            disabled={loading}
            style={{
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              border: 'none',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Zap size={13} />
            <span>{loading ? 'Evaluating...' : 'Run Live AI Audit'}</span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#dc2626',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
              }}
            >
              {error}
            </div>
          )}

          {!evaluation && !loading && (
            <div
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-light)',
              }}
            >
              <HeartPulse size={28} color="var(--accent-blue)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Audit Clinical Safety & Interactions
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0.25rem auto 0.75rem' }}>
                Evaluates active vitals, drug-drug interactions, known allergies (e.g. Penicillin $\rightarrow$ Amoxicillin), pregnancy teratogenicity, and differential diagnosis recommendations.
              </p>
              <button
                onClick={runEvaluation}
                style={{
                  backgroundColor: 'var(--primary-navy)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Start Safety Evaluation
              </button>
            </div>
          )}

          {evaluation && (
            <>
              {/* Emergency Banner if 108 required */}
              {evaluation.triage_level === 'EMERGENCY_108' && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <AlertTriangle size={24} color="#dc2626" />
                    <div>
                      <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.875rem' }}>
                        CRITICAL TRIAGE: 108 EMERGENCY TRIGGER RECOMMENDED
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                        Severe vitals instability or acute life-threatening contraindication detected.
                      </div>
                    </div>
                  </div>
                  {onTriggerSos && (
                    <button
                      onClick={onTriggerSos}
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      🚨 1-Tap SOS
                    </button>
                  )}
                </div>
              )}

              {/* Clinical Alerts Section */}
              {evaluation.alerts.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ShieldAlert size={14} color="#ea580c" />
                    <span>Clinical Warnings & Safety Alerts ({evaluation.alerts.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {evaluation.alerts.map((alert, idx) => {
                      const colors = getSeverityColor(alert.severity);
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: colors.bg,
                            borderLeft: `4px solid ${colors.border}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 0.85rem',
                            borderTop: '1px solid var(--border-light)',
                            borderRight: '1px solid var(--border-light)',
                            borderBottom: '1px solid var(--border-light)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: colors.text }}>
                              {alert.title}
                            </div>
                            <span
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: 800,
                                backgroundColor: colors.border,
                                color: '#ffffff',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {alert.description}
                          </p>
                          {alert.recommendation && (
                            <div
                              style={{
                                marginTop: '0.35rem',
                                fontSize: '0.6875rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                              }}
                            >
                              💡 Recommendation: {alert.recommendation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Drug-Drug Interactions */}
              {evaluation.drug_interactions.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Pill size={14} color="#8b5cf6" />
                    <span>Drug-Drug Interactions ({evaluation.drug_interactions.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {evaluation.drug_interactions.map((ddi, idx) => {
                      const colors = getSeverityColor(ddi.severity);
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: 'var(--bg-surface-secondary)',
                            border: `1px solid ${colors.border}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                              ⚡ {ddi.drugs.join(' ↔ ')}
                            </div>
                            <span
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: 800,
                                backgroundColor: colors.border,
                                color: '#ffffff',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              {ddi.severity} INTERACTION
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {ddi.effect}
                          </p>
                          <div
                            style={{
                              marginTop: '0.25rem',
                              fontSize: '0.6875rem',
                              color: 'var(--accent-blue)',
                              fontWeight: 600,
                            }}
                          >
                            Guidance: {ddi.recommendation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Differential Diagnoses (ICD-10) */}
              {evaluation.differential_diagnoses.length > 0 && !compact && (
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Stethoscope size={14} color="#0284c7" />
                    <span>Differential Diagnoses & ICD-10 Coding</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    {evaluation.differential_diagnoses.map((dx, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.65rem 0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                            {dx.condition}
                          </span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(2, 132, 199, 0.1)',
                              color: '#0284c7',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                            }}
                          >
                            {dx.icd10}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {dx.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle & Dietary Guidance */}
              {evaluation.lifestyle_advice.length > 0 && !compact && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#047857',
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Evidence-Based Patient Lifestyle Guidance</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#065f46' }}>
                    {evaluation.lifestyle_advice.map((adv, idx) => (
                      <li key={idx} style={{ marginBottom: '0.2rem' }}>
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.alerts.length === 0 && evaluation.drug_interactions.length === 0 && (
                <div
                  style={{
                    padding: '0.85rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: '#047857',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>No contraindications or critical drug interactions identified.</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
