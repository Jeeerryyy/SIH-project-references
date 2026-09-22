import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  ArrowRightLeft,
  PlusCircle,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  User,
  FileText,
  Phone,
  CornerDownLeft,
  Check,
} from 'lucide-react';

export const ReferralsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [referrals, setReferrals] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'inbox' | 'outbox' | 'emergency'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Referral Initiation Modal
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [receivingBranchId, setReceivingBranchId] = useState('');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [category, setCategory] = useState('MATERNAL');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counter-Referral Discharge Modal
  const [counterModalReferral, setCounterModalReferral] = useState<any | null>(null);
  const [counterNotes, setCounterNotes] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [medicationsSummary, setMedicationsSummary] = useState('');

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const filterParam = activeTab === 'emergency' ? 'all' : activeTab;
      const res = await api.get(`/referrals?filter_type=${filterParam}`);
      let list = res || [];
      if (activeTab === 'emergency') {
        list = list.filter((r: any) => r.transport_needed || r.urgency === 'EMERGENCY');
      }
      setReferrals(list);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [activeTab]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, pRes] = await Promise.all([
          api.get('/branches'),
          api.get('/patients?size=50'),
        ]);
        setBranches(bRes || []);
        setPatients(pRes.items || []);
        if (bRes.length > 0) setReceivingBranchId(bRes[0].id);
        if (pRes.items?.length > 0) setSelectedPatientId(pRes.items[0].id);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMeta();
  }, []);

  const handleInitiateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/referrals', {
        patient_id: selectedPatientId,
        receiving_branch_id: receivingBranchId,
        urgency,
        category,
        reason,
        clinical_summary: clinicalSummary,
        transport_needed: transportNeeded,
      });
      setIsInitModalOpen(false);
      setReason('');
      setClinicalSummary('');
      setTransportNeeded(false);
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Failed to initiate referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusAdvance = async (referralId: string, nextStatus: string) => {
    try {
      await api.patch(`/referrals/${referralId}/status`, { status: nextStatus });
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleCounterReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModalReferral) return;
    try {
      await api.post(`/referrals/${counterModalReferral.id}/counter-referral`, {
        counter_referral_notes: counterNotes,
        follow_up_instructions: followUpInstructions,
        prescribed_medications_summary: medicationsSummary,
      });
      setCounterModalReferral(null);
      setCounterNotes('');
      setFollowUpInstructions('');
      setMedicationsSummary('');
      fetchReferrals();
    } catch (err: any) {
      alert(err.message || 'Failed to submit counter-referral');
    }
  };

  const getUrgencyBadge = (u: string) => {
    switch (u) {
      case 'EMERGENCY':
        return <Badge variant="danger" dot>{t('referrals.urgency.EMERGENCY')}</Badge>;
      case 'URGENT':
        return <Badge variant="saffron" dot>{t('referrals.urgency.URGENT')}</Badge>;
      default:
        return <Badge variant="neutral">{t('referrals.urgency.ROUTINE')}</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED':
        return <Badge variant="success"><CheckCircle2 size={12} /> {t('referrals.status.COMPLETED')}</Badge>;
      case 'ARRIVED':
        return <Badge variant="info">{t('referrals.status.ARRIVED')}</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="warning"><Truck size={12} /> {t('referrals.status.IN_TRANSIT')}</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">{t('referrals.status.ACCEPTED')}</Badge>;
      default:
        return <Badge variant="neutral">{t('referrals.status.INITIATED')}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('referrals.title')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {t('referrals.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<PlusCircle size={16} />}
          onClick={() => setIsInitModalOpen(true)}
        >
          {t('referrals.initiate_btn')}
        </Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        {(['all', 'inbox', 'outbox', 'emergency'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === tab ? 'var(--primary-navy)' : 'var(--bg-surface-secondary)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {t(`referrals.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Referral Cards List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      ) : referrals.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No referrals found in this queue.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {referrals.map((ref) => (
            <Card key={ref.id} variant="bordered" style={{ borderLeft: ref.urgency === 'EMERGENCY' ? '4px solid var(--color-danger)' : ref.urgency === 'URGENT' ? '4px solid var(--color-saffron)' : '4px solid var(--accent-blue)' }}>
              {/* Card Top Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--accent-blue-subtle)',
                      color: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    🏥
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {ref.patient_name || 'Patient'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        [{ref.patient_mrn || 'MRN'}]
                      </span>
                      {getUrgencyBadge(ref.urgency)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Category: <strong>{ref.category}</strong> • Referred by: <strong>{ref.referred_by_name || 'Staff'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusBadge(ref.status)}
                </div>
              </div>

              {/* Route & Reason */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{ref.referring_branch_name || 'Origin Sub-Centre'}</span>
                <ArrowRightLeft size={14} color="var(--accent-blue)" />
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{ref.receiving_branch_name || 'District Hospital Jaipur'}</span>
              </div>

              {/* Clinical Reason */}
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Reason: {ref.reason}</div>
                {ref.clinical_summary && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {ref.clinical_summary}
                  </p>
                )}
              </div>

              {/* Transport Details (if 108 requested) */}
              {ref.transport_needed && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                    <Truck size={16} />
                    <span>Ambulance (108): {ref.ambulance_number || 'MH-15-EG-1108'} • Driver: {ref.driver_name || 'Santosh Shinde'}</span>
                  </div>
                  <Badge variant="danger">{ref.transport_status}</Badge>
                </div>
              )}

              {/* Counter-Referral Completed Loop */}
              {ref.counter_referral_notes && (
                <div
                  style={{
                    backgroundColor: 'var(--color-success-bg)',
                    border: '1px solid var(--color-success-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--color-success-text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CornerDownLeft size={14} /> Counter-Referral Feedback Loop (From Specialist):
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>{ref.counter_referral_notes}</div>
                  {ref.follow_up_instructions && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', marginTop: '0.35rem' }}>
                      <strong>Follow-up instructions for ASHA/CHO:</strong> {ref.follow_up_instructions}
                    </div>
                  )}
                  {ref.prescribed_medications_summary && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <strong>Medications:</strong> {ref.prescribed_medications_summary}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for Workflow Advance */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                {ref.status === 'INITIATED' && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusAdvance(ref.id, 'ACCEPTED')}>
                    Accept at Hospital
                  </Button>
                )}
                {ref.status === 'ACCEPTED' && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusAdvance(ref.id, 'ARRIVED')}>
                    Mark Patient Arrived
                  </Button>
                )}
                {(ref.status === 'ARRIVED' || ref.status === 'ACCEPTED') && !ref.counter_referral_notes && (
                  <Button size="sm" variant="primary" leftIcon={<CornerDownLeft size={14} />} onClick={() => setCounterModalReferral(ref)}>
                    Issue Counter-Referral Discharge
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Initiation Modal */}
      {isInitModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ backgroundColor: 'var(--primary-navy)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('referrals.wizard.title')}
              </h3>
              <button onClick={() => setIsInitModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleInitiateReferral} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  {t('referrals.wizard.select_patient')}
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name || ''} ({p.mrn})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    {t('referrals.wizard.receiving_branch')}
                  </label>
                  <select
                    value={receivingBranchId}
                    onChange={(e) => setReceivingBranchId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} [{b.facility_type}]</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    {t('referrals.wizard.urgency_level')}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                  >
                    <option value="ROUTINE">Routine (Normal OPD Queue)</option>
                    <option value="URGENT">Urgent (Specialist 24h Review)</option>
                    <option value="EMERGENCY">Emergency 108 (Immediate Red Alert)</option>
                  </select>
                </div>
              </div>

              <Input
                label={t('referrals.wizard.reason')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Severe Gestational Anemia Hb 6.8 or Uncontrolled BP"
                required
              />

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  {t('referrals.wizard.clinical_summary')}
                </label>
                <textarea
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  placeholder="Patient vitals, past history, medicines given at sub-centre..."
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-danger)' }}>
                <input
                  type="checkbox"
                  checked={transportNeeded}
                  onChange={(e) => setTransportNeeded(e.target.checked)}
                />
                <span>{t('referrals.wizard.request_108')}</span>
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsInitModalOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} style={{ flex: 1 }}>
                  {t('referrals.wizard.submit_btn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Counter Referral Modal */}
      {counterModalReferral && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ backgroundColor: 'var(--color-success)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('referrals.counter_referral.title')}
              </h3>
              <button onClick={() => setCounterModalReferral(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCounterReferralSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Patient: <strong>{counterModalReferral.patient_name}</strong> • Origin: <strong>{counterModalReferral.referring_branch_name}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  {t('referrals.counter_referral.notes_label')}
                </label>
                <textarea
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Specialist findings, procedures performed, current vitals..."
                  rows={3}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>

              <Input
                label={t('referrals.counter_referral.follow_up_label')}
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                placeholder="e.g. ASHA to check weekly blood pressure & ensure iron tablet intake"
                required
              />

              <Input
                label={t('referrals.counter_referral.medications_label')}
                value={medicationsSummary}
                onChange={(e) => setMedicationsSummary(e.target.value)}
                placeholder="e.g. Iron Sucrose 100mg IV completed + Folic Acid 5mg OD x 30 days"
              />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setCounterModalReferral(null)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                  {t('referrals.counter_referral.complete_btn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
