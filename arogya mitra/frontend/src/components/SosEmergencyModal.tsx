import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';
import { Phone, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosEmergencyModal: React.FC<SosModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isOpen && !isDispatched) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsDispatched(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isDispatched]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: 'var(--color-danger)',
            color: '#fff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('sos.modal_title')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                National Emergency Ambulance Service (108 / 112)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isDispatched ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '3px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  animation: 'pulseGlow 1s infinite',
                }}
              >
                {countdown}
              </div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('sos.countdown_msg')} {countdown} {t('sos.seconds')}
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Your live GPS coordinates and emergency alert will be dispatched to the nearest 108 Ambulance Unit.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button
                  variant="outline"
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  {t('sos.cancel_btn')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setIsDispatched(true)}
                  style={{ flex: 1 }}
                >
                  {t('sos.dispatch_now')}
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* ETA Box */}
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                    {t('sos.dispatched_title')}
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {t('sos.eta')}
                  </div>
                </div>
                <div style={{ fontSize: '2rem' }}>🚑</div>
              </div>

              {/* Driver Details */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>👨‍✈️</div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Santosh Shinde (108 Driver)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ambulance: MH-15-EG-1108 (2.4 km away)
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Phone size={14} />}>
                  Call
                </Button>
              </div>

              {/* Status List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                  <CheckCircle size={16} />
                  <span>{t('sos.asha_assigned')}: Savita Kadam (300m away)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                  <CheckCircle size={16} />
                  <span>{t('sos.hospital_readiness')}</span>
                </div>
              </div>

              <Button variant="primary" onClick={onClose} style={{ marginTop: '0.5rem' }}>
                Close Tracking Window
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
