import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'sos' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-navy)',
          color: 'var(--text-inverse)',
          border: 'none',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--accent-blue)',
          color: 'var(--text-inverse)',
          border: 'none',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary-navy)',
          border: '1px solid var(--border-subtle)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger)',
          color: 'var(--text-inverse)',
          border: 'none',
        };
      case 'sos':
        return {
          backgroundColor: 'var(--color-danger)',
          color: 'var(--text-inverse)',
          border: 'none',
          boxShadow: 'var(--shadow-sos)',
          animation: 'pulseGlow 2s infinite',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: 'none',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '0.35rem 0.75rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' };
      case 'lg':
        return { padding: '0.875rem 1.75rem', fontSize: '1rem', borderRadius: 'var(--radius-xl)' };
      default:
        return { padding: '0.625rem 1.25rem', fontSize: '0.875rem', borderRadius: 'var(--radius-lg)' };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.65 : 1,
        transition: 'all var(--transition-base)',
        fontFamily: 'inherit',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={className}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
