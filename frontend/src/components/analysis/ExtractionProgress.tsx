import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';

export type ExtractionStage = 'idle' | 'uploading' | 'processing' | 'done';

interface ExtractionProgressProps {
  stage: ExtractionStage;
  uploadPercent: number;
}

export const ExtractionProgress: React.FC<ExtractionProgressProps> = ({
  stage,
  uploadPercent,
}) => {
  if (stage === 'idle') return null;

  const uploadComplete = stage === 'processing' || stage === 'done';
  const processingComplete = stage === 'done';

  return (
    <Card className="bg-subtle">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-ink-primary">
            Document Processing Status
          </span>
          <span className="font-mono text-ink-secondary">
            {stage === 'uploading'
              ? `Uploading ${uploadPercent}%`
              : stage === 'processing'
                ? 'Extracting & parsing on server...'
                : 'Extraction complete'}
          </span>
        </div>

        {/* Real Upload Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full bg-crimson transition-all duration-200"
            style={{
              width: `${uploadComplete ? 100 : uploadPercent}%`,
            }}
          />
        </div>

        <ul className="space-y-2 text-xs">
          <li className="flex items-center gap-2 text-ink-primary">
            {uploadComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-crimson shrink-0" />
            )}
            <span>Uploading PDF document to backend ({uploadPercent}%)</span>
          </li>

          <li
            className={`flex items-center gap-2 ${
              stage === 'uploading' ? 'text-ink-secondary' : 'text-ink-primary'
            }`}
          >
            {processingComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : stage === 'processing' ? (
              <Loader2 className="h-4 w-4 animate-spin text-crimson shrink-0" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-border inline-block shrink-0" />
            )}
            <span>
              Validating PDF, extracting text (with OCR fallback if scanned), and structuring job fields
            </span>
          </li>
        </ul>
      </div>
    </Card>
  );
};
