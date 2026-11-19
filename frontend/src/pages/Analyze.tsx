import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FormInput } from 'lucide-react';
import { DocumentUpload } from '../components/analysis/DocumentUpload';
import { ExtractedJobDetails } from '../components/analysis/ExtractedJobDetails';
import { JobAnalysisForm } from '../components/analysis/JobAnalysisForm';
import { AlertBanner } from '../components/ui/AlertBanner';
import { useAnalysis } from '../hooks/useAnalysis';
import { predictionService } from '../services/predictionService';
import type {
  DocumentExtractionResponse,
  JobInformationExtracted,
  JobPostingInput,
} from '../types/analysis';

export const Analyze: React.FC = () => {
  const navigate = useNavigate();
  const {
    analyzePosting,
    analyzeReviewedDocument,
    isAnalyzing,
    error,
    clearError,
    isMockMode,
  } = useAnalysis();
  const [mode, setMode] = useState<'document' | 'manual'>('document');
  const [extractedDoc, setExtractedDoc] =
    useState<DocumentExtractionResponse | null>(null);

  const handleManualSubmit = async (input: JobPostingInput) => {
    try {
      const record = await analyzePosting(input);
      navigate(`/results/${record.id}`);
    } catch {
      // Error state is handled in AnalysisContext and displayed by JobAnalysisForm
    }
  };

  const handleExtractPdf = async (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<DocumentExtractionResponse> => {
    if (!predictionService.extractDocument) {
      throw new Error(
        'PDF extraction requires the live FastAPI backend (set VITE_USE_MOCK_API=false).'
      );
    }
    return predictionService.extractDocument(file, onProgress);
  };

  const handleExtractText = async (
    rawText: string
  ): Promise<DocumentExtractionResponse> => {
    if (!predictionService.extractRawText) {
      throw new Error(
        'Text extraction requires the live FastAPI backend (set VITE_USE_MOCK_API=false).'
      );
    }
    return predictionService.extractRawText(rawText);
  };

  const handleAnalyzeReviewed = async (reviewed: JobInformationExtracted) => {
    if (!extractedDoc) return;
    try {
      const record = await analyzeReviewedDocument(extractedDoc, reviewed);
      navigate(`/results/${record.id}`);
    } catch {
      // Error displayed by ExtractedJobDetails
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
            Analyze a Job Posting
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Upload a job offer PDF, paste offer text, or enter structured details manually.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-forest p-1">
          <button
            type="button"
            onClick={() => {
              setMode('document');
              clearError();
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'document'
                ? 'bg-subtle text-ink-primary border border-border'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF / Paste Offer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              clearError();
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-subtle text-ink-primary border border-border'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <FormInput className="h-3.5 w-3.5" />
            Manual Form
          </button>
        </div>
      </div>

      {isMockMode && (
        <AlertBanner
          variant="info"
          title="Demo Mode Active"
          description="Manual submissions use the mock predictor. PDF extraction requires the live FastAPI backend."
        />
      )}

      {mode === 'document' ? (
        !extractedDoc ? (
          <DocumentUpload
            onExtractPdf={handleExtractPdf}
            onExtractText={handleExtractText}
            onExtractionComplete={(result) => setExtractedDoc(result)}
            onSwitchToManual={() => setMode('manual')}
          />
        ) : (
          <ExtractedJobDetails
            extraction={extractedDoc}
            onBackToUpload={() => {
              setExtractedDoc(null);
              clearError();
            }}
            onAnalyze={handleAnalyzeReviewed}
            isAnalyzing={isAnalyzing}
            apiError={error}
          />
        )
      ) : (
        <JobAnalysisForm
          onSubmit={handleManualSubmit}
          isSubmitting={isAnalyzing}
          apiError={error}
          onClearApiError={clearError}
        />
      )}
    </div>
  );
};
