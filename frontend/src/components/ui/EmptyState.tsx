import React from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Card className="text-center py-12">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-subtle text-ink-secondary">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
};
