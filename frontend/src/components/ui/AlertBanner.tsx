import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertBannerProps {
  variant: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description?: string;
  onDismiss?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant,
  title,
  description,
  onDismiss,
  className = '',
}) => {
  const styles = {
    info: 'bg-subtle border-border text-ink-primary',
    warning: 'bg-amber-950/40 border-amber-800/70 text-amber-100',
    error: 'bg-crimson/20 border-crimson text-red-100',
    success: 'bg-subtle border-border-strong text-emerald-200',
  };

  const icons = {
    info: <Info className="h-4 w-4 text-ink-secondary shrink-0 mt-0.5" />,
    warning: <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-red-300 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${styles[variant]} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {icons[variant]}
        <div>
          <p className="font-medium">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-ink-secondary">{description}</p>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="rounded p-1 opacity-75 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ink-primary"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
