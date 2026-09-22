import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftElement,
  rightElement,
  id,
  className = '',
  style,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface-secondary)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '0 0.875rem',
          transition: 'all var(--transition-fast)',
        }}
      >
        {leftElement && <span style={{ marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>{leftElement}</span>}
        <input
          id={inputId}
          style={{
            flex: 1,
            padding: '0.65rem 0',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            ...style,
          }}
          className={className}
          {...props}
        />
        {rightElement && <span style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>{rightElement}</span>}
      </div>

      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
