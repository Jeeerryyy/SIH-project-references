import React from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../lib/i18n';
import { Globe } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    changeLanguage(nextLang);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D1B2A',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #0D1B2A 70%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem',
      }}
    >
      {/* Top Header */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            ⚕️
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
              {t('app.title')}
            </h1>
            <p style={{ fontSize: '0.6875rem', color: '#93c5fd', margin: 0, fontWeight: 500 }}>
              {t('app.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Globe size={16} />
          <span>{i18n.language === 'en' ? '🌐 हिन्दी में बदलें' : '🌐 Switch to English'}</span>
        </button>
      </header>

      {/* Center Form Card */}
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2rem 0' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          {children}
        </div>
      </main>

      {/* Footer / Trust Badges */}
      <footer style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <p style={{ color: '#94a3b8', fontWeight: 600 }}>
          Government of India • Ministry of Health & Family Welfare
        </p>
        <p style={{ fontSize: '0.6875rem' }}>
          National Digital Health Mission (ABDM) Compliant • FHIR R4 Standardized
        </p>
      </footer>
    </div>
  );
};
