import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Download,
  RefreshCw,
  ShieldAlert,
  Users,
  Building,
  Bed,
  CheckCircle,
  BarChart3,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';

interface OutbreakAlert {
  disease: string;
  cluster_location: string;
  cases_last_7d: number;
  baseline_mean: number;
  anomaly_sigma: number;
  alert_level: 'RED_OUTBREAK' | 'AMBER_WATCH' | 'NORMAL';
  rapid_action_advised: string;
}

interface GeoClusterItem {
  block: string;
  lat: number;
  lng: number;
  active_cases: number;
  dominant_condition: string;
  alert_level: 'RED_OUTBREAK' | 'AMBER_WATCH' | 'NORMAL';
  facility_hub: string;
}

interface PublicHealthOverview {
  total_consultations: number;
  active_referrals: number;
  high_risk_maternal_cases: number;
  ncd_screened_count: number;
  bed_occupancy_rate: number;
  outbreak_alerts: OutbreakAlert[];
  geo_clusters: GeoClusterItem[];
}

interface DiseaseTrendPoint {
  date: string;
  dengue: number;
  gastroenteritis: number;
  hypertension: number;
  diabetes: number;
  ari_pneumonia: number;
}

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<PublicHealthOverview | null>(null);
  const [trends, setTrends] = useState<DiseaseTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState<string>('all');
  const [selectedCluster, setSelectedCluster] = useState<GeoClusterItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, trendsData] = await Promise.all([
        api.get<PublicHealthOverview>('/analytics/overview'),
        api.get<DiseaseTrendPoint[]>('/analytics/disease-trends'),
      ]);
      setOverview(overviewData);
      setTrends(trendsData);
      if (overviewData.geo_clusters.length > 0) {
        setSelectedCluster(overviewData.geo_clusters[0]);
      }
    } catch (err) {
      console.error('Failed to load public health analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportIdspReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      district: 'Jaipur Rural & Urban Hub',
      overview,
      trends_last_7_days: trends,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IDSP_Epidemiological_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {t('analytics.title', 'Epidemiological Surveillance & GIS Analytics')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('analytics.subtitle', 'National & District Integrated Disease Surveillance Programme (IDSP) Intelligence')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchData}
            disabled={loading}
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
            <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
            <span>Refresh Live Feeds</span>
          </button>

          <button
            onClick={handleExportIdspReport}
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
            <Download size={15} />
            <span>Export IDSP Report</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="interactive-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              TOTAL CONSULTATIONS
            </span>
            <Activity size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {overview?.total_consultations.toLocaleString() || '1,420'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem' }}>
            ↑ 14.2% vs previous week (OPD & Teleconsult)
          </div>
        </div>

        <div className="interactive-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              ACTIVE CLOSED-LOOP REFERRALS
            </span>
            <TrendingUp size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {overview?.active_referrals || '18'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Sub-Centre $\rightarrow$ District Hospital bidirectional loop
          </div>
        </div>

        <div className="interactive-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              HIGH-RISK MATERNAL (ANC)
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            {overview?.high_risk_maternal_cases || '7'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#dc2626', fontWeight: 600, marginTop: '0.2rem' }}>
            Under active ASHA weekly follow-up tracking
          </div>
        </div>

        <div className="interactive-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              NCD SCREENED CITIZENS
            </span>
            <Users size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {overview?.ncd_screened_count.toLocaleString() || '342'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem' }}>
            CBAC high-risk cohorts flagged & monitored
          </div>
        </div>

        <div className="interactive-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              DISTRICT BED OCCUPANCY
            </span>
            <Bed size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
            {overview?.bed_occupancy_rate || 78.5}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            ICU / HDU / General Ward availability live
          </div>
        </div>
      </div>

      {/* 7-Day Statistical Anomaly Outbreak Alerts Banner */}
      {overview && overview.outbreak_alerts.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} color="#dc2626" />
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#991b1b' }}>
                Active Epidemiological Outbreak Alerts ({overview.outbreak_alerts.length})
              </span>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              7-Day Statistical Anomaly Trigger ($\mu + 2\sigma$)
            </span>
          </div>

          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {overview.outbreak_alerts.map((alert, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: alert.alert_level === 'RED_OUTBREAK' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.04)',
                  border: `1px solid ${alert.alert_level === 'RED_OUTBREAK' ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      🚨 {alert.disease} Anomaly Spike in {alert.cluster_location}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        backgroundColor: alert.alert_level === 'RED_OUTBREAK' ? '#ef4444' : '#f59e0b',
                        color: '#ffffff',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {alert.alert_level.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Reported Cases (Last 7d): <strong>{alert.cases_last_7d}</strong> vs Historical Baseline $\mu$: <strong>{alert.baseline_mean}</strong> (Deviation: <strong>+{alert.anomaly_sigma}σ</strong>)
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary-navy)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '0.25rem',
                    }}
                  >
                    🏥 Action: {alert.rapid_action_advised}
                  </div>
                </div>

                <button
                  onClick={() => window.alert(`Rapid Response Protocol triggered for ${alert.cluster_location}. Mobilizing medical officer & test kits.`)}
                  style={{
                    backgroundColor: 'var(--accent-blue)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Deploy Field Team
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GIS Spatial Outbreak Heatmap & Geo-Cluster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
        {/* Visual Map Simulator Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--accent-blue)" />
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--primary-navy)' }}>
                District Epidemiological GIS Hotspots
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Live Vector & Pathogen Clusters
            </span>
          </div>

          {/* Map canvas simulation with interactive nodes */}
          <div
            style={{
              height: '320px',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #334155',
              padding: '1rem',
            }}
          >
            {/* Grid Lines */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
              }}
            />

            {/* GIS Points representing blocks */}
            {overview?.geo_clusters.map((cluster, idx) => {
              const positions = [
                { top: '35%', left: '42%' }, // Jaipur Central
                { top: '65%', left: '72%' }, // Bassi Block
                { top: '25%', left: '68%' }, // Jamwa Ramgarh
                { top: '15%', left: '25%' }, // Kotputli
                { top: '75%', left: '35%' }, // Sanganer
                { top: '30%', left: '18%' }, // Chomu
              ];
              const pos = positions[idx % positions.length];
              const isSelected = selectedCluster?.block === cluster.block;
              const isRed = cluster.alert_level === 'RED_OUTBREAK';
              const isAmber = cluster.alert_level === 'AMBER_WATCH';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCluster(cluster)}
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  {/* Glowing Radar Circle */}
                  <div
                    style={{
                      width: isRed ? '36px' : '28px',
                      height: isRed ? '36px' : '28px',
                      borderRadius: '50%',
                      backgroundColor: isRed ? 'rgba(239, 68, 68, 0.4)' : isAmber ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                      border: `2px solid ${isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#10b981'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected ? '0 0 15px #60a5fa' : isRed ? '0 0 12px #ef4444' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ color: '#ffffff', fontSize: '0.6875rem', fontWeight: 800 }}>
                      {cluster.active_cases}
                    </span>
                  </div>

                  <span
                    style={{
                      color: '#e2e8f0',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      marginTop: '4px',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                    }}
                  >
                    {cluster.block}
                  </span>
                </div>
              );
            })}

            {/* Map Legend Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.625rem',
                color: '#94a3b8',
                display: 'flex',
                gap: '0.65rem',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span>Red Outbreak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span>Amber Watch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Normal Baseline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Cluster Detail Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cluster Intelligence Dossier
            </div>
            {selectedCluster ? (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                    📍 {selectedCluster.block} Block
                  </h3>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      backgroundColor:
                        selectedCluster.alert_level === 'RED_OUTBREAK'
                          ? '#ef4444'
                          : selectedCluster.alert_level === 'AMBER_WATCH'
                          ? '#f59e0b'
                          : '#10b981',
                      color: '#ffffff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {selectedCluster.alert_level.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Active Case Count</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedCluster.active_cases} Patients
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-surface-secondary)', padding: '0.65rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Dominant Condition</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {selectedCluster.dominant_condition}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>Linked Sub-Centres & Hub:</strong> {selectedCluster.facility_hub}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>GPS Coordinates:</strong> {selectedCluster.lat.toFixed(4)}°N, {selectedCluster.lng.toFixed(4)}°E
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.06)',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.2rem' }}>
                    Frontline Intervention Directives:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5 }}>
                    <li>Deploy ASHA door-to-door fever and dehydration survey.</li>
                    <li>Stock ORS, Paracetamol, and rapid diagnostic test kits at local Sub-Centre.</li>
                    <li>Notify District Public Health Laboratory for water/blood sample testing.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Click on any cluster hotspot on the map to view details.
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              onClick={() => window.alert(`Dispatched emergency alert to all ASHA workers in ${selectedCluster?.block || 'selected block'}.`)}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary-navy)',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Broadcast Alert to Frontline ASHA Workers
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Disease Trend Historical Chart */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--primary-navy)' }}>
              7-Day District Morbidity & Disease Trend (IDSP S, P & L Forms)
            </span>
          </div>

          {/* Disease Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Tracked' },
              { id: 'dengue', label: '🦟 Dengue' },
              { id: 'gastro', label: '💧 Gastroenteritis' },
              { id: 'htn', label: '❤️ Hypertension' },
              { id: 'dm', label: '🩸 Diabetes' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDisease(d.id)}
                style={{
                  backgroundColor: selectedDisease === d.id ? 'var(--accent-blue)' : 'var(--bg-surface-secondary)',
                  color: selectedDisease === d.id ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* CSS-based responsive multi-bar trend view */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trends.length || 7}, 1fr)`, gap: '0.75rem', alignItems: 'flex-end', height: '200px', padding: '1rem 0' }}>
          {trends.map((t, idx) => {
            const maxVal = 40;
            const dengueHeight = (t.dengue / maxVal) * 160;
            const gastroHeight = (t.gastroenteritis / maxVal) * 160;
            const htnHeight = (t.hypertension / maxVal) * 160;
            const dmHeight = (t.diabetes / maxVal) * 160;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px' }}>
                  {(selectedDisease === 'all' || selectedDisease === 'dengue') && (
                    <div
                      style={{
                        width: '12px',
                        height: `${dengueHeight}px`,
                        backgroundColor: '#ef4444',
                        borderRadius: '3px 3px 0 0',
                      }}
                      title={`Dengue: ${t.dengue} cases`}
                    />
                  )}
                  {(selectedDisease === 'all' || selectedDisease === 'gastro') && (
                    <div
                      style={{
                        width: '12px',
                        height: `${gastroHeight}px`,
                        backgroundColor: '#f59e0b',
                        borderRadius: '3px 3px 0 0',
                      }}
                      title={`Gastroenteritis: ${t.gastroenteritis} cases`}
                    />
                  )}
                  {(selectedDisease === 'all' || selectedDisease === 'htn') && (
                    <div
                      style={{
                        width: '12px',
                        height: `${htnHeight}px`,
                        backgroundColor: '#0284c7',
                        borderRadius: '3px 3px 0 0',
                      }}
                      title={`Hypertension: ${t.hypertension} cases`}
                    />
                  )}
                  {(selectedDisease === 'all' || selectedDisease === 'dm') && (
                    <div
                      style={{
                        width: '12px',
                        height: `${dmHeight}px`,
                        backgroundColor: '#8b5cf6',
                        borderRadius: '3px 3px 0 0',
                      }}
                      title={`Diabetes: ${t.diabetes} cases`}
                    />
                  )}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {t.date.slice(5)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
            <span>Dengue Vector</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
            <span>Gastroenteritis (Waterborne)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }} />
            <span>Hypertension (NCD)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />
            <span>Diabetes Mellitus (NCD)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;
