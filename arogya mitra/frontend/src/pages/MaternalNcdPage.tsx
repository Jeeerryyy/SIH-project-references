import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Baby,
  HeartPulse,
  ListTodo,
  AlertTriangle,
  PlusCircle,
  Calendar,
  Activity,
  CheckCircle,
  User,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const MaternalNcdPage: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'maternal' | 'ncd' | 'tasks'>('maternal');
  const [maternalList, setMaternalList] = useState<any[]>([]);
  const [ncdList, setNcdList] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ANC Enrollment Modal State
  const [isAncModalOpen, setIsAncModalOpen] = useState(false);
  const [ancPatientId, setAncPatientId] = useState('');
  const [lmpDate, setLmpDate] = useState('2026-04-01');
  const [gravida, setGravida] = useState(1);
  const [parity, setParity] = useState(0);
  const [hbLevel, setHbLevel] = useState<string>('11.5');
  const [riskPreviousCSection, setRiskPreviousCSection] = useState(false);
  const [riskHypertension, setRiskHypertension] = useState(false);

  // NCD Screening Modal State
  const [isNcdModalOpen, setIsNcdModalOpen] = useState(false);
  const [ncdPatientId, setNcdPatientId] = useState('');
  const [conditionType, setConditionType] = useState('HYPERTENSION');
  const [systolicBp, setSystolicBp] = useState('135');
  const [diastolicBp, setDiastolicBp] = useState('88');
  const [bloodSugar, setBloodSugar] = useState('120');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [mRes, nRes, tRes, pRes] = await Promise.all([
        api.get('/programs/maternal'),
        api.get('/programs/ncd'),
        api.get('/programs/frontline-tasks'),
        api.get('/patients?size=50'),
      ]);
      setMaternalList(mRes || []);
      setNcdList(nRes || []);
      setTasks(tRes || []);
      setPatients(pRes.items || []);
      if (pRes.items?.length > 0) {
        setAncPatientId(pRes.items[0].id);
        setNcdPatientId(pRes.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load maternal/NCD data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnrollAnc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const risks: string[] = [];
      if (riskPreviousCSection) risks.push('PREVIOUS_C_SECTION');
      if (riskHypertension) risks.push('GESTATIONAL_HYPERTENSION');

      await api.post('/programs/maternal', {
        patient_id: ancPatientId,
        lmp_date: lmpDate,
        gravida: Number(gravida),
        parity: Number(parity),
        hemoglobin_level: hbLevel ? parseFloat(hbLevel) : null,
        risk_factors: risks,
      });
      setIsAncModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll ANC mother');
    }
  };

  const handleRecordNcd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/programs/ncd', {
        patient_id: ncdPatientId,
        condition_type: conditionType,
        systolic_bp: systolicBp ? parseInt(systolicBp) : null,
        diastolic_bp: diastolicBp ? parseInt(diastolicBp) : null,
        fasting_blood_sugar: bloodSugar ? parseFloat(bloodSugar) : null,
      });
      setIsNcdModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record NCD screening');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('programs.title')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {t('programs.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            leftIcon={<Baby size={16} />}
            onClick={() => setIsAncModalOpen(true)}
          >
            {t('programs.enroll_anc_btn')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<HeartPulse size={16} />}
            onClick={() => setIsNcdModalOpen(true)}
          >
            {t('programs.record_ncd_btn')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('maternal')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'maternal' ? 'var(--color-saffron)' : 'var(--bg-surface-secondary)',
            color: activeTab === 'maternal' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Baby size={16} />
          <span>{t('programs.maternal_tab')} ({maternalList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ncd')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'ncd' ? 'var(--primary-navy)' : 'var(--bg-surface-secondary)',
            color: activeTab === 'ncd' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <HeartPulse size={16} />
          <span>{t('programs.ncd_tab')} ({ncdList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'tasks' ? 'var(--color-danger)' : 'var(--bg-surface-secondary)',
            color: activeTab === 'tasks' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <ListTodo size={16} />
          <span>{t('programs.tasks_tab')} ({tasks.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      ) : activeTab === 'maternal' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {maternalList.map((m) => (
            <Card
              key={m.id}
              variant="bordered"
              style={{
                borderLeft: m.high_risk_flag ? '4px solid var(--color-danger)' : '4px solid var(--color-success)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: m.high_risk_flag ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                      color: m.high_risk_flag ? 'var(--color-danger)' : 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    🤰
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {m.patient_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {m.patient_mrn} • Gravida: {m.gravida}, Parity: {m.parity}
                    </div>
                  </div>
                </div>

                {m.high_risk_flag ? (
                  <Badge variant="danger" dot>{t('programs.high_risk_badge')}</Badge>
                ) : (
                  <Badge variant="success">{t('programs.routine_badge')}</Badge>
                )}
              </div>

              {/* High Risk Factor Tags */}
              {m.risk_factors && m.risk_factors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {m.risk_factors.map((rf: string) => (
                    <span
                      key={rf}
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger-text)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-danger-border)',
                      }}
                    >
                      ⚠ {rf.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('programs.hb_level')}</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: m.hemoglobin_level && m.hemoglobin_level < 8 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                    {m.hemoglobin_level ? `${m.hemoglobin_level} g/dL` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('programs.trimester')}</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                    T{m.trimester} ({m.anc_visits_completed}/4)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('programs.edd')}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {m.edd_date}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                <span>ASHA Assigned: <strong>{m.assigned_asha_name || 'Rekha Bai'}</strong></span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Due: {m.next_visit_due || 'Overdue'}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : activeTab === 'ncd' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {ncdList.map((n) => (
            <Card
              key={n.id}
              variant="bordered"
              style={{
                borderLeft: n.severity === 'CRITICAL_HIGH_RISK' ? '4px solid var(--color-danger)' : n.severity === 'STAGE_2' ? '4px solid var(--color-saffron)' : '4px solid var(--color-success)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: n.severity === 'CRITICAL_HIGH_RISK' ? 'var(--color-danger-bg)' : 'var(--accent-blue-subtle)',
                      color: n.severity === 'CRITICAL_HIGH_RISK' ? 'var(--color-danger)' : 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    💓
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {n.patient_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {n.patient_mrn} • Condition: <strong>{n.condition_type}</strong>
                    </div>
                  </div>
                </div>

                <Badge variant={n.severity === 'CRITICAL_HIGH_RISK' ? 'danger' : n.severity === 'STAGE_2' ? 'saffron' : 'success'} dot>
                  {n.severity}
                </Badge>
              </div>

              {/* Vitals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('programs.blood_pressure')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: n.systolic_bp && n.systolic_bp >= 140 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                    {n.systolic_bp ? `${n.systolic_bp}/${n.diastolic_bp} mmHg` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('programs.blood_sugar')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: n.fasting_blood_sugar && n.fasting_blood_sugar >= 126 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                    {n.fasting_blood_sugar ? `${n.fasting_blood_sugar} mg/dL` : 'N/A'}
                  </div>
                </div>
              </div>

              {n.notes && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {n.notes}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                <span>ASHA: <strong>{n.assigned_asha_name || 'Rekha Bai'}</strong></span>
                <span>Next Checkup: <strong>{n.next_checkup_due}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Frontline Tasks */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tasks.map((task) => (
            <Card key={task.task_id} variant="bordered" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-lg)', color: 'var(--color-danger)' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {task.patient_name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        [{task.patient_mrn}]
                      </span>
                      <Badge variant="danger" dot>{task.priority}</Badge>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-danger-text)', fontWeight: 600, marginTop: '0.25rem' }}>
                      {task.description}
                    </div>
                  </div>
                </div>

                <Button size="sm" variant="secondary" onClick={() => alert(`Opening home visit checklist for ${task.patient_name}`)}>
                  Conduct Visit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ANC Modal */}
      {isAncModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ backgroundColor: 'var(--color-saffron)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('programs.enroll_anc_btn')}
              </h3>
              <button onClick={() => setIsAncModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleEnrollAnc} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Select Pregnant Mother</label>
                <select
                  value={ancPatientId}
                  onChange={(e) => setAncPatientId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                >
                  {patients.filter((p) => p.gender === 'FEMALE').map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''} ({p.mrn})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="LMP (Last Menstrual Period)" type="date" value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} required />
                <Input label="Hemoglobin (Hb in g/dL)" type="number" step="0.1" value={hbLevel} onChange={(e) => setHbLevel(e.target.value)} placeholder="e.g. 7.2" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Gravida (Pregnancies)" type="number" value={gravida} onChange={(e) => setGravida(Number(e.target.value))} />
                <Input label="Parity (Births)" type="number" value={parity} onChange={(e) => setParity(Number(e.target.value))} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>High-Risk Factors:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={riskPreviousCSection} onChange={(e) => setRiskPreviousCSection(e.target.checked)} />
                  <span>Previous Caesarean Section (C-Section)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={riskHypertension} onChange={(e) => setRiskHypertension(e.target.checked)} />
                  <span>Gestational Hypertension / Pre-Eclampsia</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsAncModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>Enroll Mother</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NCD Modal */}
      {isNcdModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('programs.record_ncd_btn')}
              </h3>
              <button onClick={() => setIsNcdModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleRecordNcd} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Select Patient</label>
                <select
                  value={ncdPatientId}
                  onChange={(e) => setNcdPatientId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''} ({p.mrn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Condition Type</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                >
                  <option value="HYPERTENSION">Hypertension (High BP)</option>
                  <option value="DIABETES">Diabetes Mellitus</option>
                  <option value="COPD">COPD / Chronic Respiratory</option>
                  <option value="CANCER_SCREENING">Oral / Cervical Screening</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Systolic BP (mmHg)" type="number" value={systolicBp} onChange={(e) => setSystolicBp(e.target.value)} placeholder="e.g. 140" />
                <Input label="Diastolic BP (mmHg)" type="number" value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value)} placeholder="e.g. 90" />
              </div>

              <Input label="Fasting Blood Sugar (FBS in mg/dL)" type="number" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} placeholder="e.g. 126" />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsNcdModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>Save Screening</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
