import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Users,
  Activity,
  Calendar,
  Video,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  Search,
  PlusCircle,
  Building,
  HeartPulse,
  Baby,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [patients, setPatients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [patientsRes, branchesRes] = await Promise.all([
          api.get('/patients?size=5'),
          api.get('/branches'),
        ]);
        setPatients(patientsRes.items || []);
        setBranches(branchesRes || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'System Administrator';
      case 'DOCTOR': return 'Medical Officer / Specialist';
      case 'CHO': return 'Community Health Officer (CHO)';
      case 'ANM': return 'Auxiliary Nurse Midwife (ANM)';
      case 'ASHA': return 'ASHA Frontline Health Worker';
      default: return role || 'Staff';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #003366 0%, #0d2847 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Badge variant="saffron" dot>Ayushman Bharat Digital Mission</Badge>
            <Badge variant="info">Phase 4 Live (CDSS • GIS Analytics • ABHA Pass)</Badge>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '0.25rem 0' }}>
            {t('dashboard.welcome_back')}, {user?.full_name || 'Doctor'}!
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#93c5fd', margin: 0 }}>
            {getRoleDisplayName(user?.role)} • Branch ID: {user?.branch_id ? user.branch_id.slice(0, 8) : 'Central Hub'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            leftIcon={<PlusCircle size={16} />}
            onClick={() => navigate('/patients')}
          >
            {t('dashboard.register_patient')}
          </Button>
          <Button
            variant="outline"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            leftIcon={<Video size={16} />}
            onClick={() => navigate('/teleconsult')}
          >
            {t('dashboard.start_teleconsult')}
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Card variant="interactive" onClick={() => navigate('/appointments')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('dashboard.today_queue')}
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                18
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <Calendar size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.5rem' }}>
            ↑ 4 waiting in Room 104
          </p>
        </Card>

        <Card variant="interactive" onClick={() => navigate('/referrals')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('dashboard.pending_referrals')}
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                6
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-saffron-bg)', color: 'var(--color-saffron)' }}>
              <ArrowRightLeft size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-saffron)', fontWeight: 600, marginTop: '0.5rem' }}>
            2 urgent upward to DH Jaipur
          </p>
        </Card>

        <Card variant="interactive" onClick={() => navigate('/ncd-tracking')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('dashboard.high_risk_alerts')}
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                3
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <ShieldAlert size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', fontWeight: 600, marginTop: '0.5rem' }}>
            1 Severe Anemia ANC • 2 High BP
          </p>
        </Card>

        <Card variant="interactive" onClick={() => navigate('/patients')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t('patients.total_registered')}
              </p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {patients.length || 5}+
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <Users size={22} />
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.5rem' }}>
            ABHA IDs linked
          </p>
        </Card>
      </div>

      {/* Role-Specific Focus Sections */}
      {(user?.role === 'CHO' || user?.role === 'ASHA' || user?.role === 'ANM') && (
        <Card
          title="Frontline Health Worker Tools (Village / Sub-Centre Level)"
          subtitle="Screening, ANC Maternal Tracking, and Teleconsult Request"
          style={{ borderLeft: '4px solid var(--color-saffron)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-saffron-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-saffron)' }}>
                <Baby size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>High-Risk ANC Tracker</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>14 Active Mothers</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
                <HeartPulse size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>NCD Screening (Diabetes/BP)</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>42 Screened this week</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--accent-blue-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--accent-blue)' }}>
                <Stethoscope size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>DH Doctor Teleconsult Link</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Specialist Room Active</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Patient Search & Recent Patients */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Patients Table */}
        <Card
          title={t('dashboard.recent_patients')}
          subtitle="Real-time patient registry from database"
          action={
            <Button size="sm" variant="ghost" rightIcon={<ChevronRight size={14} />} onClick={() => navigate('/patients')}>
              View All
            </Button>
          }
        >
          {/* Quick Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder={t('dashboard.search_patients_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-secondary)',
                outline: 'none',
              }}
            />
            <Button type="submit" size="sm" variant="secondary" leftIcon={<Search size={14} />}>
              Search
            </Button>
          </form>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {t('common.loading')}
            </div>
          ) : patients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No patients registered yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {patients.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {p.first_name[0]}{p.last_name ? p.last_name[0] : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.first_name} {p.last_name || ''}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.mrn} • {p.gender} • Blood: {p.blood_group || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Facilities / Branch Network Card */}
        <Card
          title="Hierarchical Facility Network"
          subtitle="Multi-tenant public healthcare system scoping"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {branches.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={16} color="var(--primary-navy)" />
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.name}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      [{b.code}]
                    </span>
                  </div>
                </div>
                <Badge variant={b.facility_type === 'DISTRICT_HOSPITAL' ? 'info' : 'neutral'}>
                  {b.facility_type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
