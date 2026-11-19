import React from 'react';
import { AlertBanner } from '../ui/AlertBanner';

interface ExtractionWarningsProps {
  warnings: string[];
  conflictingFields: string[];
  documentStatus: 'processed' | 'insufficient_text';
}

export const ExtractionWarnings: React.FC<ExtractionWarningsProps> = ({
  warnings,
  conflictingFields,
  documentStatus,
}) => {
  if (
    warnings.length === 0 &&
    conflictingFields.length === 0 &&
    documentStatus === 'processed'
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {documentStatus === 'insufficient_text' && (
        <AlertBanner
          variant="warning"
          title="Insufficient readable text extracted"
          description="This PDF contained very little selectable text. Fill in the key fields below or switch to Manual Form / Paste Text."
        />
      )}

      {conflictingFields.length > 0 && (
        <AlertBanner
          variant="warning"
          title="Conflicting values detected"
          description={`Multiple distinct values were found for: ${conflictingFields.join(', ')}. Please review and confirm the correct entry below.`}
        />
      )}

      {warnings.map((w, idx) => (
        <AlertBanner key={idx} variant="info" title="Extraction Notice" description={w} />
      ))}
    </div>
  );
};
