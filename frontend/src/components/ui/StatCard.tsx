import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
}) => {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {label}
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-ink-primary">
            {value}
          </p>
          {subtext && <p className="mt-1 text-xs text-ink-secondary">{subtext}</p>}
        </div>
        {icon && (
          <div className="rounded-lg border border-border bg-subtle p-2 text-ink-secondary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
