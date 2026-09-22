import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../lib/auth';
import { changeLanguage } from '../../lib/i18n';
import { useOfflineSyncStatus } from '../../lib/offlineSync';
import { SosEmergencyModal } from '../SosEmergencyModal';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  ArrowRightLeft,
  Activity,
  Pill,
  Building2,
  BarChart3,
  CreditCard,
  FlaskConical,
  Siren,
  Syringe,
  LogOut,
  Globe,
  Menu,
  X,
  ShieldCheck,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSyncStatus();

  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    changeLanguage(nextLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: t('nav.patients'), path: '/patients', icon: <Users size={18} /> },
    { label: t('nav.appointments'), path: '/appointments', icon: <Calendar size={18} /> },
    { label: t('nav.teleconsult'), path: '/teleconsult', icon: <Video size={18} /> },
    { label: t('nav.referrals'), path: '/referrals', icon: <ArrowRightLeft size={18} /> },
    { label: t('nav.lab', 'Laboratory & Diagnostics'), path: '/lab', icon: <FlaskConical size={18} /> },
    { label: t('nav.pharmacy'), path: '/pharmacy', icon: <Pill size={18} /> },
    { label: t('nav.emergency_dispatch', '108 Fleet & Trauma Bay'), path: '/emergency-dispatch', icon: <Siren size={18} /> },
    { label: t('nav.immunization', 'UIP & Vaccine Cold Chain'), path: '/immunization', icon: <Syringe size={18} /> },
    { label: t('nav.ncd_maternal'), path: '/ncd-tracking', icon: <Activity size={18} /> },
    { label: t('nav.analytics', 'Surveillance (GIS)'), path: '/analytics', icon: <BarChart3 size={18} /> },
    { label: t('nav.health_card', 'Citizen ABHA Pass'), path: '/health-card', icon: <CreditCard size={18} /> },
    { label: t('nav.admin'), path: '/admin', icon: <Building2 size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Global Header (Navy #0D1B2A) */}
      <header
        style={{
          backgroundColor: 'var(--header-bg)',
          color: '#ffffff',
          borderBottom: '1px solid var(--border-dark)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            maxWidth: '1500px',
            margin: '0 auto',
            padding: '0.625rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo and Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem',
              }}
              title="Toggle Menu"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-navy)',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                ⚕️
              </div>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                  {t('app.title')}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#93c5fd', fontWeight: 500 }}>
                  {t('app.subtitle')}
                </div>
              </div>
            </Link>
          </div>

          {/* Header Center / Facility & Live Sync Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <ShieldCheck size={14} color="#34d399" />
              <span>District Hospital Jaipur (Hub) • ABDM Connected</span>
            </div>

            {/* Offline / Online Sync Pill Badge */}
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              style={{
                backgroundColor: isOnline
                  ? pendingCount > 0
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.2)',
                border: isOnline
                  ? pendingCount > 0
                    ? '1px solid #f59e0b'
                    : '1px solid #10b981'
                  : '1px solid #ef4444',
                color: isOnline ? (pendingCount > 0 ? '#fbbf24' : '#6ee7b7') : '#fca5a5',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Click to manually synchronize with cloud database"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={13} className="spin-animation" />
                  <span>{t('sync.syncing')}</span>
                </>
              ) : isOnline ? (
                pendingCount > 0 ? (
                  <>
                    <RefreshCw size={13} />
                    <span>{pendingCount} {t('sync.queued_actions')}</span>
                  </>
                ) : (
                  <>
                    <Wifi size={13} />
                    <span>{t('sync.online')}</span>
                  </>
                )
              ) : (
                <>
                  <WifiOff size={13} />
                  <span>
                    {t('sync.offline')} ({pendingCount} queued)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Header Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* 1-Tap SOS Button */}
            <button
              onClick={() => setIsSosOpen(true)}
              className="sos-pulse-btn"
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
              title="1-Tap Emergency SOS (108)"
            >
              <span>🚨</span>
              <span>108 SOS</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Change Language"
            >
              <Globe size={14} />
              <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* User Profile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                paddingLeft: '0.5rem',
                borderLeft: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ffffff' }}>
                  {user?.full_name || 'Healthcare Staff'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#93c5fd' }}>
                  {user?.role || 'STAFF'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f87171',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={t('nav.logout')}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside
            style={{
              width: '240px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1.25rem 0.75rem',
              boxShadow: 'var(--shadow-xs)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  padding: '0.5rem 0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                Navigation Menu
              </div>

              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary-navy)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--accent-blue-subtle)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Sidebar Bottom Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.85rem',
                border: '1px solid var(--border-light)',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                ABDM & Offline Ready
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', lineHeight: 1.4 }}>
                ABHA linked, FHIR R4 clinical records, offline queuing for zero-network frontline areas.
              </p>
            </div>
          </aside>
        )}

        {/* Content View Body */}
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
            {!isOnline && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.25rem',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                }}
              >
                <WifiOff size={16} color="#d97706" />
                <span>{t('sync.offline_notice')}</span>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* SOS Emergency Modal */}
      <SosEmergencyModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </div>
  );
};
