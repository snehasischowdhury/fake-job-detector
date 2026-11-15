import React from 'react';
import { DESIGN_TOKENS } from '../../styles/designTokens';
import type { RiskLevel } from '../../types/analysis';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'demo' | 'info' | 'warning' | 'alert';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
    neutral: 'bg-subtle text-ink-secondary border-border',
    demo: 'bg-forest text-ink-primary border-border-strong',
    info: 'bg-subtle text-emerald-300 border-border-strong',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/70',
    alert: 'bg-crimson/20 text-red-200 border-crimson',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; className?: string }> = ({
  level,
  className = '',
}) => {
  const token = DESIGN_TOKENS.riskStyles[level];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide ${token.badgeBg} ${token.badgeText} ${token.badgeBorder} ${className}`}
    >
      {token.label}
    </span>
  );
};
