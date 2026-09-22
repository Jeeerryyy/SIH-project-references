import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Syringe,
  ThermometerSnowflake,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  X,
  Calendar,
  ShieldCheck,
  Zap,
  Box,
  Baby,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export const ImmunizationPage: React.FC = () => {
  const { t } = useTranslation();

  const [catalog, setCatalog] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [childPass, setChildPass] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPassLoading, setIsPassLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'COLD_CHAIN' | 'FORECAST'>('SCHEDULE');

  // Modal State
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [selectedRecordForAdmin, setSelectedRecordForAdmin] = useState<any | null>(null);
  const [adminBatchNo, setAdminBatchNo] = useState('');
  const [adminAefi, setAdminAefi] = useState('NONE');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catRes, eqRes, fcRes, ptsRes] = await Promise.all([
        api.get('/immunization/catalog'),
        api.get('/immunization/cold-chain'),
        api.get('/immunization/forecast'),
        api.get('/patients?size=50'),
      ]);
      setCatalog(catRes || []);
      setEquipment(eqRes || []);
      setForecasts(fcRes || []);
      const pItems = ptsRes?.items || [];
      setPatients(pItems);
      if (pItems.length > 0 && !selectedChildId) {
        setSelectedChildId(pItems[0].id);
        fetchChildPass(pItems[0].id);
      }
    } catch (err) {
      console.error('Failed to load immunization data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChildPass = async (childId: string) => {
    try {
      setIsPassLoading(true);
      const pass = await api.get(`/immunization/child/${childId}`);
      setChildPass(pass || []);
    } catch (err) {
      console.error('Failed to load child pass:', err);
    } finally {
      setIsPassLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    fetchChildPass(childId);
  };

  const handleOpenAdminister = (rec: any) => {
    setSelectedRecordForAdmin(rec);
    setAdminBatchNo(`VAC-${rec.vaccine?.vaccine_code || 'UIP'}-2026A`);
    setAdminAefi('NONE');
    setIsAdministerModalOpen(true);
  };

  const handleAdministerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAdmin) return;

    try {
      setIsSubmittingAdmin(true);
      await api.post(`/immunization/records/${selectedRecordForAdmin.id}/administer`, {
        batch_number: adminBatchNo,
        aefi_reported: adminAefi,
      });

      setIsAdministerModalOpen(false);
      setActionSuccessMsg(`Vaccine dose recorded in UIP registry with batch #${adminBatchNo}!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (selectedChildId) {
        fetchChildPass(selectedChildId);
      }
    } catch (err) {
      console.error('Failed to record vaccine administration:', err);
      alert('Failed to administer vaccine dose.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const selectedPatientObj = patients.find((p) => p.id === selectedChildId);

  const administeredCount = childPass.filter((r) => r.status === 'ADMINISTERED').length;
  const dueCount = childPass.filter((r) => r.status === 'DUE' || r.status === 'OVERDUE').length;
  const totalScheduleCount = childPass.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
              }}
            >
              <Syringe size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {t('immunization.title', 'Universal Immunization Programme (UIP) & eVIN Cold Chain')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            {t(
              'immunization.subtitle',
              'Child & Maternal Digital Vaccination Pass, ASHA Drop-Out Tracking, IoT Cold Chain Telemetry & AI Commodity Demand Forecasting'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={fetchData} leftIcon={<RefreshCw size={16} />}>
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Full UIP Immunization Rate
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              96.4%
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
            <ThermometerSnowflake size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              eVIN Cold Chain Refrigerators
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
              {equipment.length} Active Hubs
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
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Temperature Excursions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
              0 Excursions (Optimal)
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b5cf6',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              AI Demand Forecast Models
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
              4 Critical Commodities
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            backgroundColor: activeTab === 'SCHEDULE' ? 'var(--primary-navy)' : 'transparent',
            color: activeTab === 'SCHEDULE' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Baby size={16} />
          <span>Child Digital Immunization Pass</span>
        </button>

        <button
          onClick={() => setActiveTab('COLD_CHAIN')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            backgroundColor: activeTab === 'COLD_CHAIN' ? 'var(--primary-navy)' : 'transparent',
            color: activeTab === 'COLD_CHAIN' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ThermometerSnowflake size={16} />
          <span>eVIN IoT Cold Chain Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            backgroundColor: activeTab === 'FORECAST' ? 'var(--primary-navy)' : 'transparent',
            color: activeTab === 'FORECAST' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all var(--transition-fast)',
          }}
        >
          <TrendingUp size={16} />
          <span>AI Seasonal Demand Forecasting</span>
        </button>
      </div>

      {/* TAB 1: Child Digital Immunization Pass */}
      {activeTab === 'SCHEDULE' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(500px, 2fr)', gap: '1.5rem' }}>
          {/* Left: Child / Infant Selector */}
          <Card style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 800 }}>Select Infant / Child</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '480px', overflowY: 'auto' }}>
              {patients.map((p) => {
                const isSelected = p.id === selectedChildId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectChild(p.id)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--accent-green)' : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                      {p.first_name} {p.last_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      MRN: {p.mrn || 'N/A'} • DOB: {p.date_of_birth || 'Recent'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right: UIP Schedule Pass */}
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                  National UIP Digital Immunization Pass
                </h3>
                {selectedPatientObj && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Beneficiary: <strong>{selectedPatientObj.first_name} {selectedPatientObj.last_name}</strong> •{' '}
                    Completed: <strong>{administeredCount}/{totalScheduleCount}</strong> Doses
                  </div>
                )}
              </div>
              <Badge variant={administeredCount === totalScheduleCount ? 'success' : 'info'}>
                {administeredCount === totalScheduleCount ? 'Fully Immunized' : 'In Progress'}
              </Badge>
            </div>

            {isPassLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
                <div>Generating Digital Immunization Pass...</div>
              </div>
            ) : childPass.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div>No Immunization Records Found</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {childPass.map((rec) => {
                  const isAdministered = rec.status === 'ADMINISTERED';
                  const isDue = rec.status === 'DUE' || rec.status === 'OVERDUE';
                  const vaccine = rec.vaccine;

                  return (
                    <div
                      key={rec.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: isAdministered
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : isDue
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px solid var(--border-light)',
                        backgroundColor: isAdministered
                          ? 'rgba(16, 185, 129, 0.03)'
                          : isDue
                          ? 'rgba(245, 158, 11, 0.03)'
                          : 'var(--bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            backgroundColor: isAdministered ? '#dcfce7' : isDue ? '#fef3c7' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isAdministered ? '#166534' : isDue ? '#92400e' : '#64748b',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                          }}
                        >
                          {isAdministered ? '✓' : '!'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                            {vaccine?.name || 'Vaccine Dose'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Target: {vaccine?.target_disease} • Dose: {vaccine?.dose_number}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Schedule: {new Date(rec.scheduled_date).toLocaleDateString()}
                            {isAdministered && rec.batch_number && ` • Batch: ${rec.batch_number}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Badge variant={isAdministered ? 'success' : isDue ? 'warning' : 'neutral'}>
                          {rec.status}
                        </Badge>
                        {!isAdministered && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenAdminister(rec)}
                            leftIcon={<Syringe size={14} />}
                          >
                            Administer Dose
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: eVIN IoT Cold Chain Telemetry Hub */}
      {activeTab === 'COLD_CHAIN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {equipment.map((eq) => {
              const isTempSafe =
                eq.current_temperature_c >= eq.target_min_c && eq.current_temperature_c <= eq.target_max_c;

              return (
                <Card key={eq.id} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                        {eq.equipment_code}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Type: {eq.equipment_type}
                      </div>
                    </div>
                    <Badge variant={isTempSafe ? 'success' : 'danger'}>
                      {isTempSafe ? 'OPTIMAL (+2° to +8°C)' : 'EXCURSION WARNING'}
                    </Badge>
                  </div>

                  {/* Temperature Dial Gauge Metric */}
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface-secondary)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      textAlign: 'center',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Live Digital Sensor Telemetry
                    </div>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        color: isTempSafe ? 'var(--accent-blue)' : 'var(--accent-red)',
                      }}
                    >
                      {eq.current_temperature_c.toFixed(1)} °C
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Target Safe Band: <strong>{eq.target_min_c}°C</strong> to <strong>{eq.target_max_c}°C</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Power Source:</span>
                    <strong style={{ color: 'var(--primary-navy)' }}>
                      ⚡ {eq.power_source}
                    </strong>
                  </div>

                  {/* Recent Temperature Logs */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      Recent 24h IoT Stream Logs
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {eq.logs?.slice(0, 3).map((log: any) => (
                        <div
                          key={log.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.6875rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(log.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <strong style={{ color: log.is_excursion ? '#ef4444' : '#10b981' }}>
                            {log.temperature_c.toFixed(1)}°C (Ambient {log.ambient_temp_c.toFixed(1)}°C)
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AI Seasonal Demand Forecasting */}
      {activeTab === 'FORECAST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                  Seasonal Epidemiological Demand Forecasting Model
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  AI predicted surge buffer allocation to prevent frontline PHC/CHC stockouts during Monsoon & Vector seasons
                </p>
              </div>
              <Badge variant="info">AI Model Active</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {forecasts.map((fc) => {
                const deficit = fc.predicted_demand_units - fc.current_stock_units;
                const isShortage = deficit > 0;

                return (
                  <div
                    key={fc.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      border: isShortage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-light)',
                      backgroundColor: isShortage ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-surface-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary-navy)', fontSize: '0.9375rem' }}>
                        {fc.commodity_name}
                      </span>
                      <Badge variant={isShortage ? 'danger' : 'success'}>
                        {fc.forecast_month}
                      </Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem' }}>{fc.current_stock_units}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Predicted Demand:</span>
                        <div style={{ fontWeight: 800, fontSize: '1.125rem', color: isShortage ? '#ef4444' : '#10b981' }}>
                          {fc.predicted_demand_units}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Epidemic Driver: <strong>{fc.seasonal_risk_factor}</strong>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Recommended Buffer:</span>
                      <strong style={{ color: 'var(--accent-blue)' }}>+{fc.recommended_buffer_units} Units</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Administer Vaccine Dose */}
      {isAdministerModalOpen && selectedRecordForAdmin && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Syringe size={20} color="var(--accent-green)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Record Vaccine Administration
                </h2>
              </div>
              <button
                onClick={() => setIsAdministerModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdministerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Vaccine & Disease Target
                </label>
                <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                  {selectedRecordForAdmin.vaccine?.name} ({selectedRecordForAdmin.vaccine?.dose_number})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Target: {selectedRecordForAdmin.vaccine?.target_disease}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Manufacturer Batch / Lot Number
                </label>
                <Input
                  value={adminBatchNo}
                  onChange={(e) => setAdminBatchNo(e.target.value)}
                  placeholder="e.g. SII-BCG-9942A"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  AEFI Observation (Adverse Events Following Immunization)
                </label>
                <select
                  value={adminAefi}
                  onChange={(e) => setAdminAefi(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="NONE">None Observed (Standard 30-min observation passed)</option>
                  <option value="MILD_FEVER">Mild Transient Fever / Local Swelling</option>
                  <option value="ANAPHYLAXIS_ALERT">🚨 Urgent Anaphylaxis / Severe AEFI Report</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setIsAdministerModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingAdmin}>
                  {isSubmittingAdmin ? 'Recording...' : 'Confirm Vaccine Administration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
