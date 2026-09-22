import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'saffron' | 'neutral';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  dot = false,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = (): { bg: string; color: string; border: string; dotColor: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          border: 'var(--color-success-border)',
          dotColor: 'var(--color-success)',
        };
      case 'warning':
        return {
          bg: 'var(--color-warning-bg)',
          color: 'var(--color-warning-text)',
          border: 'var(--color-warning-border)',
          dotColor: 'var(--color-warning)',
        };
      case 'danger':
        return {
          bg: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          border: 'var(--color-danger-border)',
          dotColor: 'var(--color-danger)',
        };
      case 'saffron':
        return {
          bg: 'var(--color-saffron-bg)',
          color: 'var(--color-saffron)',
          border: 'var(--color-saffron-border)',
          dotColor: 'var(--color-saffron)',
        };
      case 'neutral':
        return {
          bg: 'var(--bg-surface-secondary)',
          color: 'var(--text-secondary)',
          border: 'var(--border-subtle)',
          dotColor: 'var(--text-muted)',
        };
      default:
        return {
          bg: 'var(--accent-blue-subtle)',
          color: 'var(--accent-blue)',
          border: 'var(--accent-blue-border)',
          dotColor: 'var(--accent-blue)',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        fontSize: '0.6875rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        backgroundColor: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        ...style,
      }}
      className={className}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: v.dotColor,
          }}
        />
      )}
      {children}
    </span>
  );
};
