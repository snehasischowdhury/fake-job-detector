import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JobAnalysisForm } from '../components/analysis/JobAnalysisForm';
import { AlertBanner } from '../components/ui/AlertBanner';
import { useAnalysis } from '../hooks/useAnalysis';
import type { JobPostingInput } from '../types/analysis';

export const Analyze: React.FC = () => {
  const navigate = useNavigate();
  const { analyzePosting, isAnalyzing, error, clearError, isMockMode } =
    useAnalysis();

  const handleSubmit = async (input: JobPostingInput) => {
    try {
      const record = await analyzePosting(input);
      navigate(`/results/${record.id}`);
    } catch {
      // Error state is handled in AnalysisContext and displayed by JobAnalysisForm
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">
          Analyze a Job Posting
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Submit a job listing to run automated text screening and independent heuristic red-flag checks.
        </p>
      </div>

      {isMockMode && (
        <AlertBanner
          variant="info"
          title="Phase 1 Demonstration Mode"
          description="Submissions currently use the frontend mock predictor so you can test validation, navigation, and result rendering before FastAPI integration."
        />
      )}

      <JobAnalysisForm
        onSubmit={handleSubmit}
        isSubmitting={isAnalyzing}
        apiError={error}
        onClearApiError={clearError}
      />
    </div>
  );
};
