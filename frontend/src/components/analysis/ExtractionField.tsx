import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ExtractedField } from '../../types/analysis';
import { Badge } from '../ui/Badge';

interface ExtractionFieldProps {
  fieldKey: string;
  label: string;
  field: ExtractedField;
  multiline?: boolean;
  onChange: (value: string) => void;
}

export const ExtractionFieldRow: React.FC<ExtractionFieldProps> = ({
  fieldKey,
  label,
  field,
  multiline = false,
  onChange,
}) => {
  const isMissing = !field.value || !field.value.trim();
  const hasConflict = Boolean(field.conflictNote);

  const confidenceLabel =
    field.confidence >= 0.85
      ? 'High match'
      : field.confidence >= 0.65
        ? 'Moderate match'
        : isMissing
          ? 'Missing'
          : 'Edited / Low';

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-canvas/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`ext-${fieldKey}`} className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
          {label}
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          {field.sourcePages.length > 0 && (
            <span className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-secondary">
              p. {field.sourcePages.join(', ')}
            </span>
          )}
          <Badge
            variant={
              hasConflict
                ? 'warning'
                : isMissing
                  ? 'neutral'
                  : field.confidence >= 0.85
                    ? 'info'
                    : 'demo'
            }
          >
            {confidenceLabel}
            {!isMissing && ` (${Math.round(field.confidence * 100)}%)`}
          </Badge>
        </div>
      </div>

      {multiline ? (
        <textarea
          id={`ext-${fieldKey}`}
          rows={3}
          value={field.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Not detected in document — enter manually if available"
          className="input-base text-sm"
        />
      ) : (
        <input
          id={`ext-${fieldKey}`}
          type="text"
          value={field.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Not detected in document — enter manually if available"
          className="input-base text-sm"
        />
      )}

      {hasConflict && (
        <p className="flex items-center gap-1.5 text-xs text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{field.conflictNote}</span>
        </p>
      )}
    </div>
  );
};
