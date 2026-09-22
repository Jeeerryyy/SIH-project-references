import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Bed,
  Shield,
  QrCode,
  FileCode2,
  CheckCircle2,
  Copy,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'WARDS' | 'ABDM' | 'AUDIT' | 'HIERARCHY'>('WARDS');

  // Wards State
  const [wards, setWards] = useState<any[]>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(true);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // ABDM Simulator State
  const [m1IdType, setM1IdType] = useState('AADHAAR');
  const [m1IdValue, setM1IdValue] = useState('987654321098');
  const [m1FullName, setM1FullName] = useState('Kavita Sharma');
  const [m1Gender, setM1Gender] = useState('FEMALE');
  const [m1Yob, setM1Yob] = useState(1994);
  const [m1Result, setM1Result] = useState<any | null>(null);
  const [isGeneratingM1, setIsGeneratingM1] = useState(false);

  const [m2PatientId, setM2PatientId] = useState('');
  const [m2AbhaNumber, setM2AbhaNumber] = useState('');
  const [m2Result, setM2Result] = useState<any | null>(null);
  const [isLinkingM2, setIsLinkingM2] = useState(false);

  const [m3AbhaNumber, setM3AbhaNumber] = useState('');
  const [m3Purpose, setM3Purpose] = useState('CARETREATMENT');
  const [m3Result, setM3Result] = useState<any | null>(null);
  const [isExchangingM3, setIsExchangingM3] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchWards = async () => {
    try {
      setIsLoadingWards(true);
      const res = await api.get('/branches/wards/all');
      setWards(res || []);
    } catch (err) {
      console.error('Failed to load wards:', err);
    } finally {
      setIsLoadingWards(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await api.get('/branches/audit-logs/recent?limit=50');
      setAuditLogs(res || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [patientsRes, branchesRes] = await Promise.all([
        api.get('/patients?size=50'),
        api.get('/branches'),
      ]);
      setPatients(patientsRes?.items || []);
      setBranches(branchesRes || []);
      if (patientsRes?.items?.length > 0) {
        setM2PatientId(patientsRes.items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch admin initial data:', err);
    }
  };

  useEffect(() => {
    fetchWards();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // ABDM Actions
  const handleGenerateAbha = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingM1(true);
    try {
      const res = await api.post('/abdm/m1/generate-abha', {
        id_type: m1IdType,
        id_value: m1IdValue,
        otp: '123456',
        full_name: m1FullName,
        gender: m1Gender,
        year_of_birth: Number(m1Yob),
      });
      setM1Result(res);
      setM2AbhaNumber(res.abha_number);
      setM3AbhaNumber(res.abha_number);
    } catch (err) {
      console.error('M1 generation failed:', err);
    } finally {
      setIsGeneratingM1(false);
    }
  };

  const handleLinkCareContext = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinkingM2(true);
    try {
      const res = await api.post('/abdm/m2/link-care-context', {
        patient_id: m2PatientId || patients[0]?.id,
        abha_number: m2AbhaNumber || m1Result?.abha_number || '91-8842-1920-3341',
        hip_facility_id: 'IN-RJ-DH-001',
      });
      setM2Result(res);
    } catch (err) {
      console.error('M2 linking failed:', err);
    } finally {
      setIsLinkingM2(false);
    }
  };

  const handleExchangeConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExchangingM3(true);
    try {
      const res = await api.post('/abdm/m3/consent/exchange', {
        patient_abha: m3AbhaNumber || m1Result?.abha_number || '91-8842-1920-3341',
        hiu_facility_id: 'IN-RJ-DH-001',
        purpose: m3Purpose,
      });
      setM3Result(res);
    } catch (err) {
      console.error('M3 consent exchange failed:', err);
    } finally {
      setIsExchangingM3(false);
    }
  };

  const copyFhirToClipboard = () => {
    if (m3Result?.fhir_bundle) {
      navigator.clipboard.writeText(JSON.stringify(m3Result.fhir_bundle, null, 2));
      setCopiedFhir(true);
      setTimeout(() => setCopiedFhir(false), 2500);
    }
  };

  // Bed stats calculations
  const totalHospitalBeds = wards.reduce((acc, w) => acc + (w.total_beds || 0), 0);
  const totalOccupiedBeds = wards.reduce((acc, w) => acc + (w.occupied_beds || 0), 0);
  const totalAvailableBeds = wards.reduce((acc, w) => acc + (w.available_beds || 0), 0);
  const totalOxygenBeds = wards.reduce((acc, w) => acc + (w.oxygen_supported_beds || 0), 0);
  const totalIcuBeds = wards.reduce((acc, w) => acc + (w.icu_ventilator_beds || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('admin.title')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {t('admin.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              if (activeTab === 'WARDS') fetchWards();
              if (activeTab === 'AUDIT') fetchAuditLogs();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light)',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'WARDS', label: t('admin.tab_wards'), icon: <Bed size={16} /> },
          { id: 'ABDM', label: t('admin.tab_abdm'), icon: <QrCode size={16} /> },
          { id: 'AUDIT', label: t('admin.tab_audit'), icon: <Shield size={16} /> },
          { id: 'HIERARCHY', label: t('admin.tab_hierarchy'), icon: <GitBranch size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--primary-navy)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: WARDS & BED OCCUPANCY */}
      {activeTab === 'WARDS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <Card variant="default">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('admin.total_beds')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {totalHospitalBeds}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Across 4 Hospital Wards</div>
            </Card>

            <Card variant="default">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('admin.occupied_beds')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '0.25rem' }}>
                {totalOccupiedBeds}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {totalHospitalBeds > 0 ? Math.round((totalOccupiedBeds / totalHospitalBeds) * 100) : 0}% Total Occupancy
              </div>
            </Card>

            <Card variant="default">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('admin.available_beds')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                {totalAvailableBeds}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Immediate Intake Capacity</div>
            </Card>

            <Card variant="default">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('admin.oxygen_supported')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)', marginTop: '0.25rem' }}>
                {totalOxygenBeds}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>High-Flow O₂ Lines</div>
            </Card>

            <Card variant="default">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('admin.icu_ventilator')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '0.25rem' }}>
                {totalIcuBeds}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Critical Life-Support Units</div>
            </Card>
          </div>

          {/* Wards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {wards.map((ward) => {
              const rate = ward.occupancy_rate || 0;
              const isHigh = rate >= 80;
              const isMedium = rate >= 50 && rate < 80;
              const barColor = isHigh ? 'var(--accent-red)' : isMedium ? 'var(--accent-amber)' : 'var(--accent-emerald)';

              return (
                <Card key={ward.id} variant="bordered">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {ward.ward_name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Ward Type: {ward.ward_type}
                      </div>
                    </div>
                    <Badge variant={isHigh ? 'danger' : isMedium ? 'warning' : 'success'}>
                      {rate}% Occupied
                    </Badge>
                  </div>

                  {/* Meter Progress Bar */}
                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <span>Bed Utilization</span>
                      <span>
                        {ward.occupied_beds} / {ward.total_beds} Beds
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: 'var(--bg-surface-secondary)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, rate)}%`,
                          height: '100%',
                          backgroundColor: barColor,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease-in-out',
                        }}
                      />
                    </div>
                  </div>

                  {/* Ward Details Pill Badges */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--bg-surface-secondary)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                      }}
                    >
                      🟢 Available: {ward.available_beds}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                        color: 'var(--accent-teal)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                      }}
                    >
                      💨 O₂ Beds: {ward.oxygen_supported_beds}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        color: 'var(--accent-blue)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                      }}
                    >
                      ⚡ ICU Ventilator: {ward.icu_ventilator_beds}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ABDM M1/M2/M3 SANDBOX SIMULATOR */}
      {activeTab === 'ABDM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Banner */}
          <Card variant="bordered">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(13, 148, 136, 0.12)',
                  color: 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Ayushman Bharat Digital Mission (ABDM) Integration Sandbox
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Interactive testing workbench for Milestone 1 (ABHA Creation), Milestone 2 (HIP Care Context Linking), and Milestone 3 (HIU Consent & FHIR R4 Bundle Exchange).
                </p>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {/* M1 Generator */}
            <Card variant="default">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Badge variant="info">
                  MILESTONE 1
                </Badge>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('admin.abdm_m1_title')}</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {t('admin.abdm_m1_desc')}
              </p>

              <form onSubmit={handleGenerateAbha} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Input
                  label="Aadhaar / Mobile Number"
                  value={m1IdValue}
                  onChange={(e) => setM1IdValue(e.target.value)}
                  placeholder="12-digit Aadhaar number"
                  required
                />
                <Input
                  label="Citizen Full Name"
                  value={m1FullName}
                  onChange={(e) => setM1FullName(e.target.value)}
                  placeholder="Full name as per Aadhaar"
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Gender
                    </label>
                    <select
                      value={m1Gender}
                      onChange={(e) => setM1Gender(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <Input
                    label="Year of Birth"
                    type="number"
                    value={m1Yob}
                    onChange={(e) => setM1Yob(Number(e.target.value))}
                    required
                  />
                </div>

                <Button variant="primary" type="submit" isLoading={isGeneratingM1} style={{ marginTop: '0.5rem' }}>
                  {t('admin.generate_abha_btn')}
                </Button>
              </form>

              {m1Result && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>ABHA Profile Created</span>
                  </div>
                  <div><strong>ABHA Number:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--primary-navy)' }}>{m1Result.abha_number}</span></div>
                  <div><strong>ABHA Address:</strong> <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{m1Result.abha_address}</span></div>
                  <div><strong>Status:</strong> {m1Result.status} (Verified)</div>
                </div>
              )}
            </Card>

            {/* M2 HIP Linking */}
            <Card variant="default">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Badge variant="warning">
                  MILESTONE 2
                </Badge>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('admin.abdm_m2_title')}</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {t('admin.abdm_m2_desc')}
              </p>

              <form onSubmit={handleLinkCareContext} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Select Citizen Patient Record
                  </label>
                  <select
                    value={m2PatientId}
                    onChange={(e) => setM2PatientId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.875rem',
                    }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} ({p.mrn})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Target ABHA Number"
                  value={m2AbhaNumber}
                  onChange={(e) => setM2AbhaNumber(e.target.value)}
                  placeholder="91-XXXX-XXXX-XXXX"
                  required
                />

                <Input label="HIP Facility ID" value="IN-RJ-DH-001 (District Hospital)" disabled />

                <Button variant="secondary" type="submit" isLoading={isLinkingM2} style={{ marginTop: '0.5rem' }}>
                  {t('admin.link_context_btn')}
                </Button>
              </form>

              {m2Result && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Care Contexts Linked</span>
                  </div>
                  <div><strong>Status:</strong> {m2Result.status}</div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <strong>Linked Contexts:</strong>
                    <ul style={{ paddingLeft: '1.25rem', margin: '0.25rem 0 0 0' }}>
                      {m2Result.care_contexts?.map((ctx: any, idx: number) => (
                        <li key={idx}>
                          {ctx.referenceNumber} ({ctx.display})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* M3 Consent Manager & FHIR R4 Bundle */}
          <Card variant="default">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Badge variant="success">
                MILESTONE 3
              </Badge>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('admin.abdm_m3_title')}</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {t('admin.abdm_m3_desc')}
            </p>

            <form
              onSubmit={handleExchangeConsent}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                alignItems: 'flex-end',
              }}
            >
              <Input
                label="Citizen ABHA Number"
                value={m3AbhaNumber}
                onChange={(e) => setM3AbhaNumber(e.target.value)}
                placeholder="91-XXXX-XXXX-XXXX"
                required
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Purpose of Request
                </label>
                <select
                  value={m3Purpose}
                  onChange={(e) => setM3Purpose(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="CARETREATMENT">Care & Direct Clinical Treatment</option>
                  <option value="EMERGENCY">Emergency Critical Triage</option>
                  <option value="PUBLICHEALTH">National Public Health Surveillance</option>
                </select>
              </div>

              <Button variant="primary" type="submit" isLoading={isExchangingM3}>
                {t('admin.exchange_consent_btn')}
              </Button>
            </form>

            {m3Result && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCode2 size={18} color="var(--accent-blue)" />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t('admin.fhir_bundle_title')}</span>
                    <Badge variant="success">
                      VALID FHIR R4
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Copy size={14} />} onClick={copyFhirToClipboard}>
                    {copiedFhir ? 'Copied!' : 'Copy JSON'}
                  </Button>
                </div>

                <div
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    padding: '1rem',
                    borderRadius: 'var(--radius-lg)',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(m3Result.fhir_bundle, null, 2)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: AUDIT STREAM */}
      {activeTab === 'AUDIT' && (
        <Card variant="bordered" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('admin.audit_title')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Immutable 256-bit HIPAA / ABDM compliant security event audit trail
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{t('admin.audit_action')}</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{t('admin.audit_entity')}</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{t('admin.audit_user')}</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{t('admin.audit_ip')}</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>{t('admin.audit_time')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAudit ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <Badge
                          variant={
                            log.action === 'CREATE'
                              ? 'success'
                              : log.action === 'DISPENSE'
                              ? 'info'
                              : log.action === 'WEBRTC_JOIN'
                              ? 'saffron'
                              : 'neutral'
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.substring(0, 8)}...)` : ''}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {log.user_id ? log.user_id.substring(0, 8) : 'System / Background Agent'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'monospace' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: HIERARCHY */}
      {activeTab === 'HIERARCHY' && (
        <Card variant="bordered">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Public Health Referral & Facility Tier Hierarchy
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Standard 4-tier Indian public health architecture with bidirectional referral protocols.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {branches.map((b, idx) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-blue-subtle)',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{b.name}</span>
                    <Badge variant="info">
                      {b.facility_type}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Code: {b.code} • District: {b.district}, {b.state} • Phone: {b.phone || '108 Dispatch'}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  Active Operational Hub
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
