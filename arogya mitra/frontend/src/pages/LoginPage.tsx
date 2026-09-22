import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SosEmergencyModal } from '../components/SosEmergencyModal';
import { Lock, User, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isSosOpen, setIsSosOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    try {
      await login(u, p);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    }
  };

  const demoRoles = [
    { label: t('auth.role_admin'), user: 'admin', pass: 'admin123', tag: 'Superadmin' },
    { label: t('auth.role_doctor'), user: 'dr.sharma', pass: 'doctor123', tag: 'District Hospital' },
    { label: t('auth.role_cho'), user: 'cho.meena', pass: 'cho123', tag: 'Bassi Sub-Centre' },
    { label: t('auth.role_anm'), user: 'anm.sunita', pass: 'anm123', tag: 'Bagru PHC' },
    { label: t('auth.role_asha'), user: 'asha.rekha', pass: 'asha123', tag: 'Village Worker' },
  ];

  return (
    <AuthLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Main Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-2xl)',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('auth.welcome_title')}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {t('auth.welcome_desc')}
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger-text)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label={t('auth.username_label')}
              placeholder={t('auth.username_placeholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftElement={<User size={16} color="var(--text-muted)" />}
              required
            />

            <Input
              label={t('auth.password_label')}
              type="password"
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftElement={<Lock size={16} color="var(--text-muted)" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {isLoading ? t('auth.signing_in') : t('auth.sign_in_btn')}
            </Button>
          </form>

          {/* Quick Demo Login Grid */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {t('auth.quick_demo_roles')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {demoRoles.map((role) => (
                <button
                  key={role.user}
                  type="button"
                  onClick={() => handleQuickLogin(role.user, role.pass)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--accent-blue-subtle)';
                    e.currentTarget.style.borderColor = 'var(--accent-blue-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{role.label}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{role.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1-Tap Emergency SOS Banner (Prominent on Login) */}
        <div
          onClick={() => setIsSosOpen(true)}
          style={{
            backgroundColor: 'rgba(225, 29, 72, 0.15)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            borderRadius: 'var(--radius-2xl)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.15)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
              }}
            >
              🚨
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#fecdd3' }}>
                {t('auth.emergency_sos_title')}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#fda4af' }}>
                {t('auth.emergency_sos_subtitle')}
              </div>
            </div>
          </div>
          <Button variant="danger" size="sm" style={{ flexShrink: 0 }}>
            {t('auth.call_108')}
          </Button>
        </div>
      </div>

      <SosEmergencyModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </AuthLayout>
  );
};
