import React, { useState } from 'react';
import { ClipboardPaste, FileUp, Play } from 'lucide-react';
import type { DocumentExtractionResponse } from '../../types/analysis';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExtractionProgress, type ExtractionStage } from './ExtractionProgress';
import { FileDropZone } from './FileDropZone';
import { PasteJobText } from './PasteJobText';

interface DocumentUploadProps {
  onExtractPdf: (
    file: File,
    onProgress: (percent: number) => void
  ) => Promise<DocumentExtractionResponse>;
  onExtractText: (rawText: string) => Promise<DocumentExtractionResponse>;
  onExtractionComplete: (result: DocumentExtractionResponse) => void;
  onSwitchToManual: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onExtractPdf,
  onExtractText,
  onExtractionComplete,
  onSwitchToManual,
}) => {
  const [methodTab, setMethodTab] = useState<'pdf' | 'paste'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<ExtractionStage>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBusy = stage === 'uploading' || stage === 'processing';

  const handleStartPdfExtraction = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploadPercent(0);
    setStage('uploading');
    try {
      const response = await onExtractPdf(selectedFile, (pct) => {
        setUploadPercent(pct);
        if (pct >= 100) {
          setStage('processing');
        }
      });
      setStage('done');
      onExtractionComplete(response);
    } catch (err) {
      setStage('idle');
      setError(
        err instanceof Error
          ? err.message
          : 'PDF extraction failed. You can try another PDF or enter the details manually.'
      );
    }
  };

  const handleTextExtraction = async (rawText: string) => {
    setError(null);
    setUploadPercent(100);
    setStage('processing');
    try {
      const response = await onExtractText(rawText);
      setStage('done');
      onExtractionComplete(response);
    } catch (err) {
      setStage('idle');
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to parse job text. You can switch to Manual Entry.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-ink-primary">
            Upload Your Job Offer
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Upload a job offer PDF or paste its contents. JobShield will automatically extract and analyse the relevant information.
          </p>
        </div>

        {/* Input Method Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setMethodTab('pdf');
              setError(null);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
              methodTab === 'pdf'
                ? 'border-border-strong bg-subtle text-ink-primary'
                : 'border-border bg-canvas text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <FileUp className="h-4 w-4 text-crimson" />
            Upload or Drop PDF
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setMethodTab('paste');
              setError(null);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
              methodTab === 'paste'
                ? 'border-border-strong bg-subtle text-ink-primary'
                : 'border-border bg-canvas text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <ClipboardPaste className="h-4 w-4 text-crimson" />
            Paste Job Text
          </button>
        </div>

        <div className="mt-5">
          {methodTab === 'pdf' ? (
            <div className="space-y-4">
              <FileDropZone
                selectedFile={selectedFile}
                onFileSelected={(file) => {
                  setSelectedFile(file);
                  setError(null);
                  setStage('idle');
                }}
                onFileRemoved={() => {
                  setSelectedFile(null);
                  setError(null);
                  setStage('idle');
                }}
                disabled={isBusy}
              />

              {selectedFile && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    isLoading={isBusy}
                    onClick={handleStartPdfExtraction}
                  >
                    <Play className="h-4 w-4" />
                    {isBusy ? 'Processing PDF...' : 'Extract Job Information'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <PasteJobText
              onExtractText={handleTextExtraction}
              isLoading={isBusy}
            />
          )}
        </div>
      </Card>

      <ExtractionProgress stage={stage} uploadPercent={uploadPercent} />

      {error && (
        <AlertBanner
          variant="error"
          title="Document extraction could not be completed"
          description={error}
          onDismiss={() => setError(null)}
        />
      )}

      {error && (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onSwitchToManual}>
            Switch to Manual Entry Form
          </Button>
        </div>
      )}
    </div>
  );
};
