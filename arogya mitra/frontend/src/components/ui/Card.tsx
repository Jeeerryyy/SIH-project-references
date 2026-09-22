import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'flat' | 'bordered';
  orientation?: 'vertical' | 'horizontal';
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  title,
  subtitle,
  action,
  className = '',
  style,
  ...props
}) => {
  const getCardStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'interactive':
        return {
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xs)',
          cursor: 'pointer',
        };
      case 'bordered':
        return {
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
        };
      case 'flat':
        return {
          backgroundColor: 'var(--bg-surface-secondary)',
          borderRadius: 'var(--radius-xl)',
        };
      default:
        return {
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
        };
    }
  };

  return (
    <div
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'all var(--transition-base)',
        ...getCardStyles(),
        ...style,
      }}
      className={`${variant === 'interactive' ? 'interactive-card' : ''} ${className}`}
      {...props}
    >
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {title && <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
